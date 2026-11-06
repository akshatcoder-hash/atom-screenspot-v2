import assert from "node:assert/strict";
import { test } from "node:test";
import { click, error, ground, image, requests, screenshotPath, setup, useServer } from "./helpers.mjs";

useServer();

for (const [name, args] of [
  ["absolute file path", () => ({ image_path: screenshotPath() })],
  ["data URL", () => ({ image_base64: `data:image/png;base64,${image}` })],
]) {
  test(`ground accepts ${name}`, async () => {
    setup();
    const result = await ground(args());
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.structuredContent, { ...click, instruction: "click Save" });
    assert.equal(requests[0].body.image_base64, image);
  });
}

const exactlyOne = /^Provide exactly one of image_path or image_base64\.$/;
const noSignature = /^image_base64 does not start with a PNG, JPEG, or WebP file signature\.$/;
const emptyInstruction = /instruction: Too small/;
for (const [name, args, pattern] of [
  ["missing image", {}, exactlyOne],
  ["both image inputs", { image_path: "/does-not-exist/shot.png", image_base64: image }, exactlyOne],
  ["relative path", { image_path: "shot.png" }, /^image_path must be an absolute path\.$/],
  ["unreadable path", { image_path: "/does-not-exist/shot.png" }, /^Cannot read image_path: \/does-not-exist\/shot\.png$/],
  ["empty instruction", { instruction: "", image_base64: image }, emptyInstruction],
  ["whitespace instruction", { instruction: "   ", image_base64: image }, emptyInstruction],
  ["invalid base64", { image_base64: "not!base64" }, noSignature],
  ["invalid data URL", { image_base64: "data:image/png;base64" }, noSignature],
  ["non-image bytes", { image_base64: Buffer.from("not a screenshot").toString("base64") }, noSignature],
]) {
  test(`ground rejects ${name} before contacting Atom`, async () => {
    setup();
    error(await ground(args), pattern);
    assert.equal(requests.length, 0);
  });
}
