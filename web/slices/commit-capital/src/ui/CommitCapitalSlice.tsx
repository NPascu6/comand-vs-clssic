import { useState } from 'react';
import type { CommitCapitalCommand } from '@atlas/contracts';
import { Alert, AlertTitle, Button, Card, EmptyState, Grid, Loading, Mono, PageHeader, Stack, StatusPill, Typography } from '@atlas/core';
import { useT } from '@atlas/i18n';
import { useCommitCapital } from '../useCommitCapital';
import { scenarios } from '../scenarios';
import { CommitCapitalForm } from './CommitCapitalForm';
import { OutcomePanel } from './OutcomePanel';
import { DecisionTraceView } from './DecisionTraceView';

export function CommitCapitalSlice() {
  const translate = useT();
  const { mode, reference, refError, outcome, busy, submitError, submit } = useCommitCapital();
  const [command, setCommand] = useState<CommitCapitalCommand>(scenarios[0].command);

  const patch = (change: Partial<CommitCapitalCommand>) => setCommand((current) => ({ ...current, ...change }));

  return (
    <>
      <PageHeader title={translate('commit.title', 'Commit Capital')} tagline={translate('commit.tagline', 'Commit capital to a co-investment, validated against upstream')}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="overline" color="text.secondary">
            {translate('commit.scenario', 'Load scenario')}
          </Typography>
          {scenarios.map((scenario) => (
            <Button
              key={scenario.id}
              size="sm"
              variant="ghost"
              onClick={() => {
                setCommand(scenario.command);
                submit(scenario.command);
              }}
            >
              {scenario.id} · {scenario.label}
            </Button>
          ))}
        </Stack>
      </PageHeader>

      {refError ? (
        <Card edge="red">
          <Stack sx={{ gap: 1, alignItems: 'flex-start' }}>
            <StatusPill tone="danger">{translate('commit.referenceUnavailable', 'Reference data unavailable')}</StatusPill>
            <Typography variant="body2">
              {translate('commit.referenceFailed', 'Could not load reference data')} (<Mono>{mode}</Mono>): <Mono>{refError}</Mono>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {translate('commit.referenceFix', 'Switch to Mock in the header, or start the API:')} <Mono>dotnet run --project src/Atlas.Api</Mono>
            </Typography>
          </Stack>
        </Card>
      ) : !reference ? (
        <Loading label={translate('commit.loadingReference', 'Loading reference data…')} />
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CommitCapitalForm value={command} reference={reference} onChange={patch} onSubmit={() => submit(command)} busy={busy} />
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack sx={{ gap: 2.5 }}>
              {submitError ? (
                <Alert severity="error">
                  <AlertTitle>{translate('commit.requestFailed', 'Request failed')}</AlertTitle>
                  <Mono>{submitError}</Mono>
                </Alert>
              ) : null}
              {outcome ? (
                <>
                  <OutcomePanel outcome={outcome} />
                  <DecisionTraceView trace={outcome.trace} />
                </>
              ) : (
                <EmptyState
                  title={translate('commit.noOutcome', 'No outcome yet')}
                  description={translate('commit.noOutcomeHint', 'Submit a commitment to see the outcome and its decision trace.')}
                />
              )}
            </Stack>
          </Grid>
        </Grid>
      )}
    </>
  );
}
