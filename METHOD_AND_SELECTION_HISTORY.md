# Method and selection chronology

The two evidence rows use the identical frozen four-bit artifact. Neither result uses later trained LoRA variants. Quantization changes representation; ReGround1024 changes the inference method and call budget. It does not turn the weights into a separate trained model.

The local source history was inspected read-only. Commit timestamps and prose establish what was recorded, not an independently witnessed experimental preregistration:

| Recorded event | Commit / author time | Implication |
|---|---|---|
| Fixed geometry and six named strategies introduced; research memo names one-shot and ReGround1024 as planned baseline runs plus the dev winner | `770b5cd668f457f1acd18a6ff77aa2d18259179f`, 2026-09-21T22:09:52+04:00 | ReGround1024 was specified before the first committed v2 strategy result files. Does not rule out uncommitted prior evaluation. |
| First committed v2 strategy results | `e698d9b20dbe1c015b72212e45bde866d5fa1e68`, 2026-09-22T04:19:36+04:00 | One-shot 966/1272, refinement 984/1272. |
| Campaign finals discuss multiple Pro/v2 strategies; dev winner multiview does not beat ReGround1024 | `629776a288127cf8b9075d29ca1530d0a30d0a5f`, 2026-09-22T06:31:34+04:00 | Benchmark outcomes were visible during the campaign. |
| Baseline draft calls configs dev-selected but explicitly describes ReGround1024 as best Atom-only on Pro, already run | `fc109b5f96d12719170ded538dca82d751069f24`, 2026-09-22T06:45:42+04:00 | The later blanket “both selected only on dev” statement is too strong. |
| Retrospective selection-gap replays fail to beat 77.36% | `c5618b80b8860267aed81ca774fa4932c15a4213`, 2026-09-23T01:18:17+04:00 | Further benchmark inspection occurred; no better replay promoted. |
| Frozen baseline reproduction and submission document recorded | `0d681cff7689662cbae877f1bf81d44fda6a7528`, 2026-09-25T08:05:42+07:00 | Stored reproduction predictions reproduce earlier aggregates. |
| Evidence package prepared | 2026-10-25 | Public revision authentication and saved-prediction rescoring only; zero inference. |

The 200-item OS-Atlas development matrix records one-shot 43.0%, ReGround1024 40.0%, multiview 43.0% (winning the icon-accuracy tie-break). ReGround1024 was therefore not the dev-matrix winner. It was a named baseline configuration and was later described as the best tested Atom-only Pro strategy. We cannot certify hidden-test blindness or reconstruct exact pre-run decisions from immutable evidence.

These facts do **not** indicate ground-truth boxes were used to choose an individual prediction. Inspection of the inference path shows screenshot+instruction only: full-frame prediction, deterministic crop from that point, second prediction, deterministic last-valid replacement. The observed saved ReGround1024 traces obey that geometry and final-point rule on all 1272 items. No confidence or oracle selector participates in this method. Ground truth enters only after final-point creation for scoring.

Both configurations can be fairly presented as disclosed, author-reported measured systems with their different call budgets and the above selection history. The 77.36% number is verified from existing predictions on authenticated data; it is not a promise of a fresh runtime producing identical outputs, nor proof of official listing or independent reproduction. The two-pass precedent in the leaderboard shows the method class is not blanket-excluded. Actual procedure, evidence sufficiency and acceptance remain the maintainer's decision.
