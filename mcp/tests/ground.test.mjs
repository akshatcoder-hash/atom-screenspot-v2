import assert from "node:assert/strict";
import { test } from "node:test";
import { click, closeStub, error, ground, image, json, requests, rpc, setup, useServer } from "./helpers.mjs";

useServer();

test("STUB demo: ground returns coordinates and keeps the screenshot out of the model's content", async (t) => {
  setup();
  const tools = await rpc("tools/list");
  assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), ["atom_health", "ground"]);
  const result = await ground({ image_base64: image });
  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, { ...click, instruction: "click Save" });
  assert.match(result.content[0].text, /pixel \(0, 0\).*normalized \(500, 500\)/);
  assert.ok(result.content.every((block) => !JSON.stringify(block).includes(image)));
  assert.deepEqual(requests, [{ path: "/ground", body: { instruction: "click Save", image_base64: image } }]);
  t.diagnostic(`STUB ONLY, not Atom inference: ${JSON.stringify(result.structuredContent)}`);
});

test("ground accepts a point on the image's far edge", async () => {
  const edge = { ...click, pixel: { x: 1, y: 1 } };
  setup((_req, res) => json(res, edge));
  const result = await ground({ image_base64: image });
  assert.deepEqual(result.structuredContent, { ...edge, instruction: "click Save" });
});

test("ground reports Atom abstaining without inventing a click", async () => {
  setup((_req, res) => json(res, { action: "abstain", reason: "target not found" }));
  const result = await ground({ image_base64: image });
  error(result, /Atom abstained: target not found/);
  assert.doesNotMatch(result.content[0].text, /undefined/);
});

// Runs last: it closes the stub.
test("ground reports Atom down", async () => {
  await closeStub();
  error(await ground({ image_base64: image }), /Atom is not reachable.*ECONNREFUSED/);
});
