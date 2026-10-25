This guide records the original evidence-package preparation. Repository publication is a separate step; it does not constitute a leaderboard submission or fresh inference reproduction. Commands assume the repository root.

# Atom: ScreenSpot-v2 evidence for maintainer review

Prepared 2026-10-25. This package presents **two configurations of the same frozen TinyClick-derived four-bit checkpoint**. It contains no weights, dataset images, private paths or internal chat logs.

| Configuration | Hits / all examples | Accuracy | Actual model calls |
|---|---:|---:|---:|
| Atom four-bit, one-shot | 966 / 1272 | **75.9434%** | 1272 (1/example) |
| Atom four-bit + ReGround1024 | 984 / 1272 | **77.3585%** | 2544 (2/example) |

**Verification status:** these are saved historical predictions, freshly rescored during package preparation against authenticated ScreenSpot-v2 annotations and image dimensions. No model inference, training or tuning was run during preparation. All 1272 IDs and saved hit flags agree with rescoring in each configuration. Do not describe this preparation as a fresh end-to-end benchmark reproduction or independent maintainer verification.

Both may be presented as separately disclosed grounding systems for review. A [maintainer leaderboard commit](https://github.com/GUI-Agent/grounding-leaderboard/commit/82f5a9e02416960890755a3f8bd67a1b412feb66) already includes HuzzleWorld-3B (Zoom In), explicitly described as two-pass grounding with saved predictions rescored by the maintainer. This establishes a two-pass precedent, not unconditional eligibility or acceptance for Atom. The current v2 submission procedure remains unconfirmed. No email was sent and no submission or publication was made.

## Four-bit and two-pass mean different things

Four-bit describes weight storage/quantization. It is used by **both** rows. One-shot and ReGround1024 describe how many times that checkpoint is used to answer one screenshot/instruction.

The model is approximately **0.27B parameters**, not 161M parameters. The pinned upstream MLX BF16 tensor header contains 270,906,368 elements across 666 serialized tensors. The frozen four-bit weight file is **163,524,711 bytes**; the complete 13-file package is **169,049,084 bytes (161.22 MiB)** including tokenizer, processor and configs. Four-bit is affine group-size 64 on eligible Linear/Embedding modules including vision; other tensors remain F16. It is not a uniformly four-bit tensor file. Two-pass uses the same package and no second model, OCR, planner or adapter.

Weight SHA-256:

```text
c4632a244c9e8354417c2f44900d28886022971843b5ab5ce37e92227aef01ca
```

See `metadata/checkpoint.json` for all 13 exact file sizes/digests and lineage. The frozen artifact has no additional gradient updates: Samsung TinyClick / Florence-2 Base lineage, via `lokendra77/TinyClick-mlx` revision `c450f599d49c727abee1ee0322aa2ac271a09365`. The repository author selected, quantized, packaged and evaluated it. Later trained adapters are different artifacts and are not used in these rows.

## What ReGround1024 actually does

1. Run the model on the entire screenshot using the lowercased trained prompt: `What to do to execute the command? {instruction}`; temperature 0, at most 32 generated tokens.
2. Decode two `<loc_N>` tokens as a point; with four or more, use the center of the first four. Convert the point from 0–1000 model space to original screenshot pixels using division by **1000**, as in the historical implementation.
3. Cut a square from the **original-resolution** screenshot. Side length is `min(1024, width, height)`. Center it on the first predicted point, then shift it inside the screenshot boundaries and round the top-left coordinates with Python `round`. This means a 960×540 screenshot produces a 540×540 crop, not a padded 1024×1024 crop.
4. Run the same model and instruction on the crop. The checkpoint processor resizes the whole input image to **768×768** with bicubic resampling and its pinned normalization; this applies to both the initial screenshot and crop. Cropping makes local details larger at model input, but can also remove context or move a correct first prediction away from its target.
5. Map the crop prediction back: `pixel_x = crop_x0 + crop_point_x/1000 * crop_width`, analogously for y. Convert that full-image pixel point to 0–1000 coordinates for scoring/output.
6. Use the second valid point unconditionally. There is **no confidence ranking, ground-truth comparison, oracle, best-of-two selection, or per-example crop-size tuning**. If refinement yields no point, retain the first. A full-image duplicate crop is skipped. In these saved runs all 1272 items have exactly two calls, no runtime errors, and the final point equals the mapped second prediction.

Ground-truth boxes do not enter model input or crop selection; they are used only by the evaluator after prediction. A model exception is retried once (each attempt counted); a parse-only null point is not an exception and is not automatically retried. Scoring retains every example and counts missing predictions as misses. The historical `selection` label stayed `full` even after valid refinement: this stale label is preserved as `historical_selection_label`; final-point/traces establish actual behavior.

The observed change is +18 hits (+1.4151 percentage points): 79 gained and 61 lost. It does not by itself establish a statistically significant or generalizable improvement. Historical warm latency was p50/p95 359.1/398.4 ms one-shot and 744.2/851.3 ms two-pass on the recorded M4; these timing numbers were not remeasured today.

## Dataset authentication and leaderboard alignment

Primary dataset: `OS-Copilot/ScreenSpot-v2` at **`5efbb1f1b5463a575f2eb7bc30fe29e49c15f93c`**, all 1272 examples (desktop 334, web 437, mobile 501).

- All three retained annotation JSON files match the Git blob IDs returned for this exact revision.
- A public copy of `screenspotv2_image.zip` was downloaded once; its full 1,331,012,233-byte SHA-256 matches the pinned LFS object: `750555b8b06e3898634c610cd904600feb7ec7ca530e625a00c1416a73d829ee`.
- Every one of the **730 unique referenced image members** was read through ZIP CRC checks, hashed and inspected for dimensions. All dimensions match the retained historical index. The 31 resident local originals checked also match; remaining original local placeholders were not hydrated. No image bytes are included in this package.
- The cited maintainer rescore used `lmms-lab/ScreenSpot-v2`. We read its five annotation columns over HTTPS byte ranges at pinned revision **`e585981517e2a2ef3ec4ab6a0668008baca24137`**. All 1272 rows match OS-Copilot by screenshot filename, instruction, `[x,y,w,h]` bbox, target type and source. The duplicate filename/instruction key occurs twice in both datasets with matching records; row order is not assumed across the two repositories. This required only 274,034 bytes of Parquet ranges, not their image columns; whole lmms Parquet LFS hashes were not downloaded/verified.

Thus there is no identified ground-truth difference requiring a change from 966/984 hits for this lmms annotation copy. The specific historical lmms revision used by the maintainer was not given in that commit, so its identity to our pinned copy is not independently proved. Scoring is inclusive point-in-box after xywh→xyxy conversion, micro-averaged over all examples. Target-type breakdowns come from authenticated `data_type`; historical CU JSON `ui_type` was blank due to a parser-field mismatch.

## Files

- `predictions/atom_fourbit_oneshot.jsonl`, `predictions/atom_fourbit_reground1024.jsonl`: every saved example, final normalized/pixel prediction, crop traces, raw output (historically truncated to 160 chars), hit, timing and calls. Added image identity/type/dimensions are authenticated dataset metadata. Local paths and irrelevant manifest fields were removed; every numerical prediction and trace was preserved.
- `metrics.json`, `metrics.csv`: freshly recomputed totals and platform, target-type, platform×type and source breakdowns.
- `metadata/`: checkpoint/file digests; source result/evaluator hashes; exact dataset and image authentication; lmms alignment; historical versus current-observed environment.
- `config.json`: fixed protocol. `METHOD_AND_SELECTION_HISTORY.md` discloses campaign chronology and limitations.
- `scripts/rescore.py`: standard-library-only replay of saved predictions; no model calls.
- `scripts/run_inference.py`: newly authored minimal implementation of this fixed inference protocol. Syntax and saved-trace geometry were checked; **not model-run or established as output-identical** to the historical repository code. Original repository code was not redistributed because no repository-wide redistribution license was found. See `ATTRIBUTION.md` and `LICENSE`.
- `SHA256SUMS`: integrity list for every package file except the list itself.

## Recompute saved scores

Provide the three official annotation files from the pinned revision in a directory named `data` (or any directory passed explicitly). No images, MLX, model or installation is needed for saved-prediction rescoring:

```sh
python3 scripts/rescore.py --data data
```

The script verifies annotation Git blob IDs, then uses image dimensions authenticated from the pinned archive. It rejects duplicate/missing predictions and mismatched instructions/images. Optional `--out new-rescore.json` refuses to overwrite an existing result.

Reviewer-controlled data retrieval, if needed (not required when supplying an authenticated local copy):

```sh
mkdir -p data
REV=5efbb1f1b5463a575f2eb7bc30fe29e49c15f93c
for SPLIT in desktop web mobile; do
  curl --fail --location "https://huggingface.co/datasets/OS-Copilot/ScreenSpot-v2/resolve/$REV/screenspot_${SPLIT}_v2.json" --output "data/screenspot_${SPLIT}_v2.json"
done
```

## Optional fresh inference, separately labeled

**No fresh inference was needed or performed for this package.** To reproduce model execution, provide the exact separately supplied 13-file checkpoint and pinned image archive, use one MLX worker serially, and choose fresh output paths. No supplied script installs dependencies or downloads weights. Current observed dependency versions are in `requirements-current-observed.txt`; this is not an immutable historical lock. Historical Python/OS were 3.11.15/macOS 26.6.2; preparation used Python 3.11.17/macOS 27.0.1.

```sh
python scripts/run_inference.py --run-model --checkpoint checkpoint \
  --data data --images-zip screenspotv2_image.zip \
  --strategy oneshot --out fresh-oneshot.jsonl
python scripts/run_inference.py --run-model --checkpoint checkpoint \
  --data data --images-zip screenspotv2_image.zip \
  --strategy reground1024 --out fresh-reground1024.jsonl
python3 scripts/rescore.py --data data \
  --predictions fresh-oneshot.jsonl fresh-reground1024.jsonl
```

The runner verifies every checkpoint file and the entire archive before loading the model, and records the fresh environment separately. It cannot guarantee the historical counts on changed kernels, OS or dependencies; do not tune, change prompts/crops, rerun until a target score appears, or replace the historical files with fresh output.

Original historical evaluator entry point: `scripts/eval_screenspot.py` with `--version v2 --split all --worker tinyclick --strategy oneshot` or `reground1024`, `--dataset <pinned snapshot>` and `--model-path <exact checkpoint>`. Reproduction reference commit `2d11d58e712f0e44a58511640ee3feb4397c716f`; relevant source hashes are in `metadata/historical_evaluator.json`. Access to the original private source can be arranged separately if needed.

## Remaining limitations for review

Historical full environment export/stdout and test-blind preregistration were not recovered. Strategy exploration and retrospective benchmark inspection occurred; do not claim a prospective unseen-test selection protocol. The short raw traces cannot reconstruct all generated tokens. Model/data training decontamination was not independently established. The upstream model mirror has no declared license, and original project notices identify unresolved attribution text; no model weights or processor code are redistributed here. A maintainer may request further access, formatting, fresh inference or other evidence. This package is ready for **review**, not a claim of acceptance.
