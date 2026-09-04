# command

## Purpose

The sync as one command, in the pattern the rest of the repository uses. `command.ts` is the
input as a value — the payload, the committed export, the author — so a rule can be tested
without a network or a disk. `rules.ts` is the five gates, each a named function returning a
failure rather than throwing, so a broken export reports its contract failure *and* its contrast
failure in one pass. `handler.ts` runs the rules, then the effect, and returns the decision trace
either way.
