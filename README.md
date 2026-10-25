# Atom on ScreenSpot-v2

Saved predictions and reproducibility evidence for two configurations of **Atom**, a four-bit deployment of Samsung TinyClick with Florence-2 Base lineage.

| Configuration | Correct / evaluated | Grounding accuracy | Calls per example |
|---|---:|---:|---:|
| Atom four-bit, one-shot | 966 / 1,272 | **75.9434%** | 1 |
| Atom four-bit + ReGround1024 | 984 / 1,272 | **77.3585%** | 2 |

Both results were verified by rescoring historical predictions against authenticated data. **No fresh model inference was performed during evidence preparation.** These are author-reported click-grounding results, not multi-step task success or an accepted leaderboard submission.

## Method

Both rows use the same checkpoint. Four-bit describes weight quantization; one-shot and ReGround1024 describe inference.

One-shot predicts on the full screenshot. ReGround1024 takes that prediction, cuts an original-resolution square with side `min(1024, width, height)`, shifts it inside the image bounds, and runs the same model on the crop. The processor resizes each input to 768 × 768. The second point maps back to the original screenshot and replaces the first whenever valid. There is no ground-truth or confidence-based choice between candidates.

The prompt is lowercased `What to do to execute the command? {instruction}`, temperature is `0`, and generation is limited to `32` tokens. Scoring uses normalized coordinates divided by `1000`, inclusive point-in-box checks and all 1,272 examples. Missing predictions count as misses. Every saved refinement example has exactly two calls; all final points match the mapped second prediction. The [full protocol](docs/REPRODUCIBILITY.md) covers parsing, fallback and retry behavior.

## Evidence

- Predictions and traces: [one-shot](predictions/atom_fourbit_oneshot.jsonl) · [ReGround1024](predictions/atom_fourbit_reground1024.jsonl).
- Recomputed metrics and breakdowns: [JSON](metrics.json) · [CSV](metrics.csv).
- Provenance: [checkpoint](metadata/checkpoint.json) · [dataset authentication](metadata/dataset_authentication.json) · [lmms-lab alignment](metadata/leaderboard_dataset_alignment.json).
- Reproduction: [fixed configuration](config.json) · [environment record](metadata/environment.json) · [detailed guide](docs/REPRODUCIBILITY.md).

The primary dataset is `OS-Copilot/ScreenSpot-v2` revision `5efbb1f1b5463a575f2eb7bc30fe29e49c15f93c`: desktop 334, web 437, mobile 501. All annotation files match pinned Git blob IDs; the complete image archive matches its LFS SHA-256. All 730 referenced image dimensions were verified. All 1,272 annotations also match the pinned lmms-lab copy identified in the alignment record.

## Rescore

Place the three pinned annotation JSON files in `data/`, then run from the repository root:

```sh
python3 scripts/rescore.py --data data
shasum -a 256 -c SHA256SUMS
python3 -m unittest discover -s tests -v
```

Rescoring uses Python's standard library and authenticated image dimensions; it needs no model or images. The script checks annotation hashes, coverage and example identity. Expected totals are 966/1272 and 984/1272. Data retrieval and optional fresh-inference commands are in the [guide](docs/REPRODUCIBILITY.md).

## Checkpoint

The model is approximately **0.27B parameters**, not 161M parameters. The weight file is 163,524,711 bytes; the complete 13-file runtime package is **169,049,084 bytes / 161.22 MiB**. Its weight SHA-256 is:

```text
c4632a244c9e8354417c2f44900d28886022971843b5ab5ce37e92227aef01ca
```

The frozen artifact has no additional gradient updates. Its MLX source is `lokendra77/TinyClick-mlx` revision `c450f599d49c727abee1ee0322aa2ac271a09365`. Weights, images and unlicensed private source are excluded. [Attribution](ATTRIBUTION.md) documents upstream licensing and notice uncertainties; the [MIT license](LICENSE) covers only the newly authored scripts and documentation.

## Limits

The new inference runner's model-output parity is **untested**; only syntax and geometry/decoding against saved traces were verified. The current dependency snapshot is not an immutable historical environment. Multiple strategies and Pro/v2 outcomes were inspected during the campaign; strict test-blind preregistration and selection solely on dev are not established. See the [selection history](METHOD_AND_SELECTION_HISTORY.md) and [verification record](VERIFICATION.md). Raw traces are truncated to 160 characters, and training-data decontamination was not independently established.

Both configurations are presented separately with their call budgets. [Two-pass grounding has leaderboard precedent](https://github.com/GUI-Agent/grounding-leaderboard/commit/82f5a9e02416960890755a3f8bd67a1b412feb66); Atom's submission procedure and acceptance remain unconfirmed.
