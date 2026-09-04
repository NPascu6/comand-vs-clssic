import { useEffect, useMemo, useState } from 'react';
import type { CommitCapitalCommand, CommitOutcome, ReferenceData } from '@atlas/contracts';
import { useDataSource } from '@atlas/platform';
import { makeApiClient, mockClient } from './client';

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useCommitCapital() {
  const dataSource = useDataSource();
  const client = useMemo(() => (dataSource.mode === 'api' ? makeApiClient(dataSource.apiBaseUrl) : mockClient), [dataSource.mode, dataSource.apiBaseUrl]);

  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CommitOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setReference(null);
    setRefError(null);
    setOutcome(null);
    client
      .reference()
      .then((data) => alive && setReference(data))
      .catch((error) => alive && setRefError(describeError(error)));
    return () => {
      alive = false;
    };
  }, [client]);

  async function submit(command: CommitCapitalCommand) {
    setBusy(true);
    setSubmitError(null);
    try {
      setOutcome(await client.commit(command));
    } catch (error) {
      setSubmitError(describeError(error));
    } finally {
      setBusy(false);
    }
  }

  return { mode: dataSource.mode, reference, refError, outcome, busy, submitError, submit };
}
