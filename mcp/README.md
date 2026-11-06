# atom-mcp

An MCP server, built with [mcp-use](https://github.com/mcp-use/mcp-use), that exposes Atom as a `ground` tool. Give it a screenshot and a short instruction ("click the Save button") and it returns one click point. `ground` also renders an MCP Apps view: the screenshot, with a cursor that swoops in along a short trail and lands on the predicted point, where a ring marks it. With `prefers-reduced-motion` the path is straight.

Atom is a visual grounding model derived from TinyClick. It is 169 MB and runs on Apple silicon. It scores 75.9% on ScreenSpot v2 (966/1,272); that number is author-reported and not on a public leaderboard.

## Status: Atom's runtime is not public yet

This server is plain Node and does no inference itself. It forwards each call to an Atom API at `ATOM_URL`. That API (Atom's inference server and model) is not public yet, and it only runs on Apple silicon, so there is no hosted version of this server.

Without the API, `ground` and `atom_health` return `isError: true` with `Atom is not reachable at …`. To see the MCP side work, run `npm test`: it builds the server and drives it over HTTP against a protocol stub that returns a fixed point. The stub checks the wiring, the view resource, and the error paths. It says nothing about Atom's accuracy.

### Run against the real Atom API

`scripts/live-check.mjs` renders a page with five elements at known positions, screenshots it in headless Chrome, and asks the running server to ground each one. In two runs on an M3 against the 4-bit checkpoint, 5 of 5 clicks landed inside the element's box. An earlier version of the page let the "Download PDF" link wrap onto two lines, so the 22 px box the script scored against was too small and a correct click on the link counted as a miss. That is fixed with `white-space: nowrap`, and I checked once, by hand, that Chrome renders each element in the box the script uses. The first call took about 5 s while the model loaded, the rest about 400 ms. This is five elements on one synthetic page, a sanity check of the wiring and not a measure of accuracy; the ScreenSpot-v2 numbers are in the repository root README.

The swoop curve is unit-tested. The view's rendering is not covered by automated tests; I checked it by eye in `mcp-use screenshot` captures (light and dark), not in Claude Desktop or ChatGPT.

## Run

Requires Node 22.22.2 or later (`engines` in package.json).

```bash
cd mcp
npm install
npm test                         # build, then test against the protocol stub
npm run build && npm start       # http://localhost:3000/mcp
npm start -- --with-inspector    # same, plus the Inspector at /mcp/inspector
npm run dev                      # dev server, Inspector at /mcp/inspector
```

Settings: `ATOM_URL` (default `http://127.0.0.1:8760`), `ATOM_TIMEOUT_MS` (default 180000, because the first call loads the model), `PORT`.

Connect a client: `claude mcp add --transport http atom http://localhost:3000/mcp`.
Shell smoke test (needs python3): `bash scripts/smoke.sh /abs/path/shot.png "click the Save button"`.
Live check against a running Atom API and server (needs Chrome): `node scripts/live-check.mjs`.

## Tools

- `ground`: `instruction` plus exactly one of `image_path` (absolute path) or `image_base64` (bare or data URL). PNG, JPEG, or WebP. Returns the point in 0-1000 normalized and pixel coordinates.
  The server only sniffs the file signature (the first few bytes), so a truncated or corrupt file can still pass.
- `atom_health`: returns the Atom API's `/health` response.

Failures (Atom down, timeout, abstain, bad input, unexpected response) come back as `isError: true` with a one-line reason.

## Atom API contract

What this server sends and accepts. `/health` and `/ground` were exercised against the real Atom API by the live check above; the error shapes come from the stub:

- `GET /health` returns `{"ok": true, "result": {...}}`.
- `POST /ground` with `{"instruction": "...", "image_base64": "..."}` returns `{"ok": true, "result": {"action": "click", "normalized": {"x", "y"}, "pixel": {"x", "y"}, "image": {"width", "height"}, "duration_ms"}}`. Any other `action` is an abstain, with an optional `reason`.
- Errors return `{"ok": false, "error": "..."}`.

## Notes

The screenshot reaches the view through the result's `_meta`, so it stays out of the model's context. The Atom API has no auth; keep it on loopback. `npm start` also listens on `127.0.0.1` only (checked: a connection to the machine's LAN address is refused). `ground` reads any absolute `image_path` that starts with an image signature, so do not expose the server beyond loopback.

This directory is separate from the evidence in the rest of the repository: its files are not listed in `SHA256SUMS`. It is covered by the repository's MIT license.
