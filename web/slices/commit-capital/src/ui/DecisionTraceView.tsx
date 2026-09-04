import type { DecisionTrace, TraceEntry } from '@atlas/contracts';
import type { GridColDef } from '@atlas/core';
import { Card, CardHeader, DataGrid, Mono, Stack, StatusPill, Typography } from '@atlas/core';
import { useT } from '@atlas/i18n';

export function DecisionTraceView({ trace }: { trace: DecisionTrace }) {
  const translate = useT();

  const columns: GridColDef<TraceEntry>[] = [
    { field: 'rule', headerName: translate('commit.trace.rule', 'Rule'), flex: 1.2, minWidth: 180, renderCell: (params) => <Mono>{params.row.rule}</Mono> },
    {
      field: 'kind',
      headerName: translate('commit.trace.kind', 'Kind'),
      width: 110,
      renderCell: (params) => <StatusPill tone={params.row.kind === 'Upstream' ? 'info' : 'neutral'}>{params.row.kind}</StatusPill>,
    },
    {
      field: 'outcome',
      headerName: translate('commit.trace.outcome', 'Outcome'),
      width: 100,
      renderCell: (params) => <StatusPill tone={params.row.outcome === 'Passed' ? 'success' : 'danger'}>{params.row.outcome}</StatusPill>,
    },
    { field: 'elapsedMs', headerName: translate('commit.trace.elapsed', 'ms'), type: 'number', width: 80, valueFormatter: (value: number) => value.toFixed(1) },
    { field: 'description', headerName: translate('commit.trace.description', 'Description'), flex: 2, minWidth: 220 },
  ];

  // Failure messages sit under the grid, not in a cell: compact rows are single-line and the messages need the mono font.
  const failures = trace.entries.filter((entry) => entry.messages.length > 0);

  return (
    <Card edge="navy" padded={false}>
      <CardHeader title={translate('commit.trace.title', 'Decision trace')} action={<Mono color="secondary">{trace.correlationId}</Mono>} />
      <Stack sx={{ gap: 1.5, p: 2.5 }}>
        <Typography variant="caption" color="text.secondary">
          {trace.passed} {translate('commit.trace.passed', 'passed')} · {trace.failed} {translate('commit.trace.failed', 'failed')} · {translate('commit.trace.sum', 'sum-of-rules')}{' '}
          {trace.totalRuleMs.toFixed(1)}ms ({translate('commit.trace.concurrent', 'run concurrently')})
        </Typography>
        <DataGrid<TraceEntry> rows={trace.entries} columns={columns} idField="rule" toolbar={false} hideFooter />
        {failures.length > 0 ? (
          <Stack sx={{ gap: 0.5 }}>
            {failures.flatMap((entry) =>
              entry.messages.map((message, index) => (
                <Mono key={`${entry.rule}-${index}`} color="error">
                  {entry.rule}: {message}
                </Mono>
              )),
            )}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
