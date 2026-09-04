import type { CommitCapitalCommand, CommitOutcome, ReferenceData } from '@atlas/contracts';
import { referenceData } from '@atlas/contracts';
import { getJson, postJson } from '@atlas/platform';
import { evaluateCommit } from './rules';

// The slice OWNS its data access. Two interchangeable implementations of one
// interface — the rest of the slice never knows which is in use.
export interface CommitCapitalClient {
  reference(): Promise<ReferenceData>;
  commit(cmd: CommitCapitalCommand): Promise<CommitOutcome>;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let counter = 0;
const nextCorrelationId = () => `MOCK-${(++counter).toString().padStart(3, '0')}`;

/** Deterministic, offline. Mirrors the backend seed + rules. */
export const mockClient: CommitCapitalClient = {
  async reference() {
    await delay(60);
    return referenceData;
  },
  async commit(cmd) {
    await delay(120);
    return evaluateCommit(cmd, referenceData, nextCorrelationId());
  },
};

/** Calls the live ASP.NET CommitCapital API (src/Atlas.Api). */
export function makeApiClient(baseUrl: string): CommitCapitalClient {
  return {
    reference: () => getJson<ReferenceData>(`${baseUrl}/reference`),
    commit: (cmd) => postJson<CommitOutcome>(`${baseUrl}/commitments`, cmd),
  };
}
