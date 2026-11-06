import assert from "node:assert/strict";
import { test } from "node:test";
import { ground, image, rpc, setup, useServer } from "./helpers.mjs";

useServer();

test("ground advertises a view and the view resource is readable", async () => {
  const { tools } = await rpc("tools/list");
  const uri = tools.find((tool) => tool.name === "ground")._meta.ui.resourceUri;
  assert.match(uri, /^ui:\/\//);
  const resource = await rpc("resources/read", { uri });
  assert.match(resource.contents[0].mimeType, /text\/html/);
  assert.match(resource.contents[0].text, /<html/);
});

for (const [name, base64, mime] of [
  ["PNG", image, "image/png"],
  ["JPEG", Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString("base64"), "image/jpeg"],
  ["WebP", Buffer.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]).toString("base64"), "image/webp"],
]) {
  test(`ground hands the ${name} screenshot to the view`, async () => {
    setup();
    const result = await ground({ image_base64: base64 });
    assert.equal(result._meta.imageDataUrl, `data:${mime};base64,${base64}`);
  });
}
