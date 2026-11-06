import assert from "node:assert/strict";
import { test } from "node:test";
import { SWOOP_MS, swoopPoint } from "../views/ground/swoop.ts";

const from = { x: 0, y: 0 };
const to = { x: 400, y: 300 };

// Distance of a point from the straight line between `from` and `to`.
function offLine(p) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  return Math.abs((to.x - from.x) * (from.y - p.y) - (from.x - p.x) * (to.y - from.y)) / length;
}

test("the swoop starts at the start and lands exactly on the target", () => {
  assert.deepEqual(swoopPoint(from, to, 0), from);
  assert.deepEqual(swoopPoint(from, to, 1), to);
});

test("progress outside 0..1 is clamped", () => {
  assert.deepEqual(swoopPoint(from, to, -3), from);
  assert.deepEqual(swoopPoint(from, to, 7), to);
});

test("a long move bows away from the straight line", () => {
  assert.ok(offLine(swoopPoint(from, to, 0.5)) > 20);
});

test("reduced motion keeps the path straight and still lands on the target", () => {
  for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) assert.ok(offLine(swoopPoint(from, to, t, true)) < 1e-9);
  assert.deepEqual(swoopPoint(from, to, 0.5, true), { x: 200, y: 150 });
  assert.deepEqual(swoopPoint(from, to, 1, true), to);
});

test("the bow is capped, so a very long move does not swing wide", () => {
  const far = { x: 4000, y: 3000 };
  const mid = swoopPoint(from, far, 0.5);
  const length = Math.hypot(far.x, far.y);
  const off = Math.abs(far.x * (from.y - mid.y) - (from.x - mid.x) * far.y) / length;
  assert.ok(off <= 140);
});

test("a move of zero length returns the target", () => {
  assert.deepEqual(swoopPoint(to, to, 0.5), to);
});

test("the swoop lasts about half a second", () => {
  assert.ok(SWOOP_MS >= 400 && SWOOP_MS <= 800);
});
