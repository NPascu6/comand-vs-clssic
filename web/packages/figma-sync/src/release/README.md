# release

## Purpose

What a release is made of. `diff.ts` compares two exports by value and derives the semver bump
from the shape of the change — a removed or retyped token is major, an added one minor, a moved
value patch. `ledger.ts` owns `tokens.lock.json`: the digest, the version, and who published each
release. `format.ts` writes DTCG back deterministically; `report.ts` renders the diff a reviewer
reads on the pull request.
