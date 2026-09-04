import type { AssetClass, CommitCapitalCommand, Liquidity, Region, ReferenceData } from '@atlas/contracts';
import { Button, Field, Select, TextInput } from '@atlas/core';

const ASSET_CLASSES: AssetClass[] = ['PrivateEquity', 'PrivateCredit', 'LiquidEquity', 'Etf'];
const REGIONS: Region[] = ['NorthAmerica', 'Emea', 'Apac', 'Latam'];
const LIQUIDITIES: Liquidity[] = ['Illiquid', 'Liquid'];

interface Opt {
  value: string;
  label: string;
}

/** Ensure the current value is always selectable, even if not in the list (e.g. a missing id). */
function withCurrent(options: Opt[], current: string): Opt[] {
  return options.some((o) => o.value === current) ? options : [{ value: current, label: `${current || '—'} (not found)` }, ...options];
}

export interface CommitCapitalFormProps {
  value: CommitCapitalCommand;
  reference: ReferenceData;
  onChange: (patch: Partial<CommitCapitalCommand>) => void;
  onSubmit: () => void;
  busy: boolean;
}

export function CommitCapitalForm({ value, reference, onChange, onSubmit, busy }: CommitCapitalFormProps) {
  const fundOpts = withCurrent(reference.funds.map((p) => ({ value: p.fundId, label: `${p.fundId} — ${p.name}` })), value.fundId);
  const coInvestOpts = withCurrent(reference.coInvestments.map((c) => ({ value: c.coInvestmentId, label: c.coInvestmentId })), value.coInvestmentId);
  const dealOpts = withCurrent(reference.deals.map((d) => ({ value: d.dealId, label: `${d.dealId} — ${d.name}` })), value.dealId);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fund">
          <Select value={value.fundId} onChange={(e) => onChange({ fundId: e.target.value })}>
            {fundOpts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Co-investment">
          <Select value={value.coInvestmentId} onChange={(e) => onChange({ coInvestmentId: e.target.value })}>
            {coInvestOpts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Deal">
          <Select value={value.dealId} onChange={(e) => onChange({ dealId: e.target.value })}>
            {dealOpts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Requested by">
          <TextInput value={value.requestedBy} onChange={(e) => onChange({ requestedBy: e.target.value })} placeholder="pm.alice" />
        </Field>
        <Field label="Amount">
          <TextInput type="number" value={value.amount} onChange={(e) => onChange({ amount: Number(e.target.value) })} />
        </Field>
        <Field label="Currency">
          <TextInput value={value.currency} maxLength={4} onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Asset class">
          <Select value={value.assetClass} onChange={(e) => onChange({ assetClass: e.target.value as AssetClass })}>
            {ASSET_CLASSES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label="Region">
          <Select value={value.region} onChange={(e) => onChange({ region: e.target.value as Region })}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Liquidity">
          <Select value={value.liquidity} onChange={(e) => onChange({ liquidity: e.target.value as Liquidity })}>
            {LIQUIDITIES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </Field>
        <Field label="Commitment date">
          <TextInput type="date" value={value.commitmentDate} onChange={(e) => onChange({ commitmentDate: e.target.value })} />
        </Field>
      </div>
      <Button type="submit" disabled={busy}>{busy ? 'Validating…' : 'Commit capital'}</Button>
    </form>
  );
}
