import type { CommitCapitalCommand, CommitOutcome, ReferenceData } from '@atlas/contracts';
import { referenceData } from '@atlas/contracts';
import { getJson, postJson } from '@atlas/platform';
import { evaluateCommit } from './rules';

export interface CommitCapitalClient {
  reference(): Promise<ReferenceData>;
  commit(command: CommitCapitalCommand): Promise<CommitOutcome>;
}

const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

let counter = 0;
const nextCorrelationId = () => `MOCK-${(++counter).toString().padStart(3, '0')}`;

/** Deterministic, offline. Mirrors the backend seed + rules. */
export const mockClient: CommitCapitalClient = {
  async reference() {
    await delay(60);
    return referenceData;
  },
  async commit(command) {
    await delay(120);
    return evaluateCommit(command, referenceData, nextCorrelationId());
  },
};

/** Calls the live ASP.NET CommitCapital API (src/Atlas.Api). */
export function makeApiClient(baseUrl: string): CommitCapitalClient {
  return {
    reference: () => getJson<ReferenceData>(`${baseUrl}/reference`),
    commit: (command) => postJson<CommitOutcome>(`${baseUrl}/commitments`, command),
  };
}
