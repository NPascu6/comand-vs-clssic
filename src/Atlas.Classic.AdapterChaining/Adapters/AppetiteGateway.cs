using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// AppetiteGateway: wraps IAppetiteClient AND chains into ExposureGateway to
// assemble the fused AppetiteContext, then owns rule 6 (AppetiteWithinLimit).
//
// This adapter is where the "chaining" in the pattern name is most visible: it
// depends on another adapter (ExposureGateway), which depends on a client. To
// unit-test rule 6 you therefore have to stand up BOTH the appetite client and
// the exposure gateway (and through it the exposure client) — three collaborators
// for one rule. That is the testability cost the README calls out.
// ---------------------------------------------------------------------------

public sealed class AppetiteGateway(IAppetiteClient client, ExposureGateway exposure)
    : AdapterBase("AppetitePolicyStore")
{
    private readonly IAppetiteClient _client = client;
    private readonly ExposureGateway _exposure = exposure;

    /// <summary>
    /// Builds the fused appetite context for one bucket: the configured ceiling
    /// (from the appetite store) plus the current committed amount (from the
    /// exposure gateway, reached by chaining). Two upstream round-trips are hidden
    /// behind this one call.
    /// </summary>
    public async Task<AppetiteContext> LoadForBucketAsync(
        string fundId, AssetClass assetClass, Region region, CancellationToken ct)
    {
        var limits = await _client.GetLimitsAsync(fundId, ct).ConfigureAwait(false);

        // Hand-matching the limit for this bucket. The contract gives every limit
        // a Bucket key, so we line them up by key rather than comparing the two
        // enum fields ourselves — one fewer place to get the pairing wrong.
        var bucketKey = Buckets.Key(assetClass, region);
        var limit = limits.FirstOrDefault(l => l.Bucket == bucketKey);

        // Chain into the sibling adapter for the committed figure.
        var committed = await _exposure
            .GetCommittedInBucketAsync(fundId, assetClass, region, ct)
            .ConfigureAwait(false);

        // Mapping the two sources into one internal context. "No limit configured"
        // is represented as a flag here; the decision about what that MEANS
        // (fail-closed) is made in the rule below, one layer further down — so the
        // policy is split from the data that triggers it.
        return new AppetiteContext
        {
            HasConfiguredLimit = limit is not null,
            MaxAmount = limit?.MaxAmount ?? 0m,
            AlreadyCommittedInBucket = committed,
        };
    }

    /// <summary>
    /// Rule 6: AppetiteWithinLimit. Fail-closed when no limit is configured, then
    /// check committed + amount against the ceiling. Needs the request Amount, so
    /// — like the others — the facade threads it down here.
    /// </summary>
    public void EnsureWithinLimit(AppetiteContext appetite, AssetClass assetClass, Region region, decimal amount)
    {
        // BUSINESS RULE FRAGMENT: "if no limit configured, FAIL" lives here, far
        // from rule 2/3 (fund gateway) and rule 4 (deal gateway). Adding a
        // seventh rule, or changing fail-closed to fail-open, means hunting across
        // these adapter files to find every fragment.
        if (!appetite.HasConfiguredLimit)
            throw new CommitmentValidationException(
                $"No appetite limit is configured for bucket {assetClass}|{region}; commitment refused.");

        var projected = appetite.AlreadyCommittedInBucket + amount;
        if (projected > appetite.MaxAmount)
            throw new CommitmentValidationException(
                $"Appetite breached for {assetClass}|{region}: committed {appetite.AlreadyCommittedInBucket:N0} " +
                $"+ requested {amount:N0} = {projected:N0} exceeds limit {appetite.MaxAmount:N0}.");
    }
}
