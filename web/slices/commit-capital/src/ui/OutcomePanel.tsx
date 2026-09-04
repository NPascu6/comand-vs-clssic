import type { CommitOutcome } from '@atlas/contracts';
import { Alert, Box, Card, Mono, Stack, StatusPill, Typography } from '@atlas/core';
import { useT } from '@atlas/i18n';

export function OutcomePanel({ outcome }: { outcome: CommitOutcome }) {
  const translate = useT();
  if (outcome.approved) {
    return (
      <Card edge="green">
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
          <StatusPill tone="success">{translate('commit.approved', 'Approved')}</StatusPill>
          <Typography variant="body2" color="text.secondary">
            {translate('commit.recorded', 'commitment recorded')}
          </Typography>
        </Stack>
        <Box sx={{ mt: 1.5 }}>
          <Mono>{outcome.commitmentId}</Mono>
        </Box>
      </Card>
    );
  }
  return (
    <Card edge="red">
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
        <StatusPill tone="danger">{translate('commit.rejected', 'Rejected')}</StatusPill>
        <Typography variant="body2" color="text.secondary">
          {outcome.errors.length} {translate('commit.errorsInOnePass', 'error(s) — all reported in one pass')}
        </Typography>
      </Stack>
      <Stack sx={{ gap: 1, mt: 2 }}>
        {outcome.errors.map((error, index) => (
          <Alert key={index} severity="error">
            <Mono>{error.code}</Mono> {error.message}
          </Alert>
        ))}
      </Stack>
    </Card>
  );
}
