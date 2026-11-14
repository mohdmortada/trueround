# Scorecard

The official record of a decision: three judges, each round scored on the 10-point must system, red on the left and blue on the right, totals behind a heavy rule. This is the product's signature component; everything else borrows its rules and figures.

- `judges` is one array per judge of `[red, blue]` pairs per round.
- `result` is `{ winner: 'red' | 'blue', method }`. Write the method in full: "Unanimous decision", "Submission (rear-naked choke) R2 2:41", "Referee stops contest R1 1:12".
- `verifiedBy` names the official who signed the bout sheet; it renders as a verified badge.
- Scores are written by officials only. Athletes and coaches see them read-only.
