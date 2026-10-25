# Repository validation

The source evidence ZIP matched SHA-256
`4e0d6eeb2adb6ded0d9822a1f411c311568a8ce8dd8dfcf8acb1b9ad4b8d5af7`.
All 22 original archive members passed CRC and file-digest verification before
the repository documentation was reorganized. Numerical evidence was preserved.

Executed checks for this checkout:

- Standalone rescoring against the authenticated annotation files: 966/1272
  one-shot and 984/1272 ReGround1024, with zero saved-hit disagreements.
- Complete IDs and call counts: 1,272 unique examples per run; 1,272 and
  2,544 calls respectively; zero recorded runtime errors.
- All 1,272 saved refinement traces match crop geometry, decoding, coordinate
  mapping and final-point selection in the new reference implementation.
- Offline unit tests cover coverage/totals, saved-trace agreement, inclusive
  scoring boundaries, missing points, altered-annotation rejection and file
  integrity. No model runtime is invoked.
- Every distributable file appears in `SHA256SUMS` except the checksum list
  itself. The complete tracked manifest was reviewed before publication.
- Privacy scan excludes personal paths, credentials, private Git URLs and
  internal logs. No weights, screenshots, datasets or unlicensed private
  evaluator source are included. Upstream filename references occur only in
  provenance metadata.
- The MIT license applies to newly authored scripts/documentation. The upstream
  licensing and attribution limits remain in `ATTRIBUTION.md`.

These checks verify saved evidence and protocol geometry. They do not establish
fresh inference parity, recover the original full environment or certify the
experiment's selection history; see `METHOD_AND_SELECTION_HISTORY.md`.
