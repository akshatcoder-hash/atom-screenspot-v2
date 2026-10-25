# Preparation verification, 2026-10-25

Executed without importing or invoking a model runtime:

- All three OS-Copilot annotation files matched immutable-revision Git blob IDs.
- The entire official image archive matched its pinned LFS SHA-256. All 730 referenced images passed ZIP CRC checks and received individual SHA-256/dimension records. All saved historical dimensions matched those authoritative image dimensions; 31 resident retained image files also matched byte-for-byte.
- All 1272 rows matched the pinned lmms-lab annotation copy on image filename, instruction, bbox, target type and source; no missing or differing records.
- Standalone `scripts/rescore.py` executed against pinned annotations and bundled predictions: **966/1272** and **984/1272**, zero saved hit disagreements, no missing/duplicate IDs.
- The newly authored runner's crop calculation, raw coordinate decoding, crop-to-full-image mapping and final-point rule matched **every saved ReGround1024 trace (1272/1272)**. Both scripts passed Python syntax parsing. This checks saved-trace protocol parity, not MLX inference parity.
- Both historical prediction files had exactly 1272 unique items, 1272 / 2544 calls respectively, and zero recorded runtime exceptions. The final point equaled the final trace's mapped point in all rows.
- All 13 retained checkpoint files matched the independent retained runtime package manifest. Full checkpoint file digests and original result-file digests are included.
- The current observed inference dependency closure contains 54 installed packages and no missing required distributions under current platform markers. It is recorded separately from the historical environment. No dependency installation took place.

Not executed: model inference, training, conversion, quantization, dependency installation, test-set tuning, uploads to a public host, submission or maintainer contact. No promise is made that the newly authored runner produces identical generated tokens under a different environment. The original historical private evaluator is identified by commits and hashes.

Original historical artifact bytes were preserved. Public evidence files contain sanitized metadata and unchanged saved points/traces. The archive includes `SHA256SUMS`; unpack it and run `shasum -a 256 -c SHA256SUMS` within the package directory to verify integrity.
