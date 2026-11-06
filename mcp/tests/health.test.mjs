import assert from "node:assert/strict";
import { test } from "node:test";
import { closeStub, error, health, json, setup, useServer } from "./helpers.mjs";

useServer();

test("atom_health forwards the stub health result", async () => {
  setup((_req, res) => json(res, { status: "stub", model: "not-Atom" }));
  const result = await health();
  assert.deepEqual(result.structuredContent, { status: "stub", model: "not-Atom" });
});

// Runs last: it closes the stub.
test("atom_health reports Atom down", async () => {
  await closeStub();
  error(await health(), /Atom is not reachable.*ECONNREFUSED/);
});
