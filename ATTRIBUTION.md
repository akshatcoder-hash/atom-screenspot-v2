# Attribution and redistribution scope

Atom's frozen checkpoint is a packaged/quantized derivative of **Samsung TinyClick**, based on **Microsoft Florence-2 Base**. The retained evaluation artifact adds no additional gradient updates. The MLX source is `lokendra77/TinyClick-mlx`, revision `c450f599d49c727abee1ee0322aa2ac271a09365`. Metadata for this mirror declares no model license. Historical project notices record upstream MIT declarations through `Krystianz/TinyClick` revision `0e1356f0b7cfb416099207121f6a766818ab8a66` and Florence-2 Base, while flagging reconstructed copyright-holder text and the mirror's missing license declaration. This preparation did not resolve those uncertainties and makes no new legal determination.

**No model weights, tokenizer assets, model processor source, original project source tree or dataset images are included.** The 13-file checkpoint digest manifest identifies the measured artifact; any later model redistribution must carry accurate upstream licenses/notices and resolve the documented attribution uncertainty. The exact checkpoint can be provided separately subject to those requirements.

Original historical evaluator source is identified by relative filenames, Git commits and SHA-256 only. No repository-wide license was found for that project, so its source was not copied. The minimal scripts in this package were newly authored for evidence preparation from the disclosed protocol and are licensed under the accompanying MIT license. Their verification status is explicit: saved-point rescoring and saved-trace geometry were executed, model inference was not.

Prediction evidence includes benchmark image identifiers, instructions, target-type/source labels, model outputs and computed coordinates/metrics for review; no standalone dataset annotation distribution or images are bundled. Obtain benchmark data from the original pinned sources:

- https://huggingface.co/datasets/OS-Copilot/ScreenSpot-v2/tree/5efbb1f1b5463a575f2eb7bc30fe29e49c15f93c
- https://huggingface.co/datasets/lmms-lab/ScreenSpot-v2/tree/e585981517e2a2ef3ec4ab6a0668008baca24137
- https://huggingface.co/lokendra77/TinyClick-mlx/tree/c450f599d49c727abee1ee0322aa2ac271a09365

Leaderboard precedent and dataset-scoring description:

- https://github.com/GUI-Agent/grounding-leaderboard/commit/82f5a9e02416960890755a3f8bd67a1b412feb66

No original maintainer email, private chat logs, personal filesystem paths or credentials are included in the shareable archive.
