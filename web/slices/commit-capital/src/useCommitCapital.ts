import { useEffect, useMemo, useState } from 'react';
import type { CommitCapitalCommand, CommitOutcome, ReferenceData } from '@atlas/contracts';
import { useDataSource } from '@atlas/platform';
import { makeApiClient, mockClient } from './client';

export function useCommitCapital() {
  const ds = useDataSource();
  const client = useMemo(() => (ds.mode === 'api' ? makeApiClient(ds.apiBaseUrl) : mockClient), [ds.mode, ds.apiBaseUrl]);

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
      .then((r) => alive && setReference(r))
      .catch((e: unknown) => alive && setRefError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [client]);

  async function submit(cmd: CommitCapitalCommand) {
    setBusy(true);
    setSubmitError(null);
    try {
      setOutcome(await client.commit(cmd));
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return { mode: ds.mode, reference, refError, outcome, busy, submitError, submit };
}
