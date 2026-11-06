import { test } from "node:test";
import { click, error, ground, image, json, setup, useServer } from "./helpers.mjs";

useServer();

for (const [name, handler, pattern] of [
  ["HTTP failure even with ok true", (_req, res) => json(res, click, 503), /^Atom 503: unexpected response$/],
  ["API error", (_req, res) => res.end(JSON.stringify({ ok: false, error: "model unavailable" })), /^Atom 200: model unavailable$/],
  ["non-JSON response", (_req, res) => res.end("<html>unavailable</html>"), /^Atom 200: unexpected response$/],
  ["missing result", (_req, res) => res.end('{"ok":true}'), /^Atom 200: unexpected response$/],
  ["malformed click", (_req, res) => json(res, { action: "click" }), /^Atom 200: unexpected response$/],
  ["out-of-range point", (_req, res) => json(res, { ...click, normalized: { x: 1001, y: 0 } }), /^Atom 200: unexpected response$/],
  ...[
    { x: -100, y: 999999 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 2 },
  ].map((pixel) => [
    `pixel (${pixel.x}, ${pixel.y}) outside a 1x1 image`,
    (_req, res) => json(res, { ...click, pixel }),
    /^Atom 200: unexpected response$/,
  ]),
  ["timeout before headers", (_req, res) => setTimeout(() => json(res, click), 400), /timed out/],
  ["timeout reading body", (_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.write('{"ok":true,');
    setTimeout(() => res.end(`"result":${JSON.stringify(click)}}`), 400);
  }, /timed out/],
]) {
  test(`ground reports ${name}`, async () => {
    setup(handler);
    error(await ground({ image_base64: image }), pattern);
  });
}
