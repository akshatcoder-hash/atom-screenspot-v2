import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before } from "node:test";

// Protocol stub only. This does not load Atom or perform inference.
export const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=";
export const click = {
  action: "click",
  normalized: { x: 500, y: 500 },
  pixel: { x: 0, y: 0 },
  image: { width: 1, height: 1 },
  duration_ms: 12,
};

export let requests;
let reply;
let mcp;
let url;
let directory;
const stub = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  requests.push({ path: req.url, body: body ? JSON.parse(body) : undefined });
  reply(req, res);
});

export function json(res, result, status = 200) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, result }));
}

export function setup(handler = (_req, res) => json(res, click)) {
  requests = [];
  reply = handler;
}

export const screenshotPath = () => `${directory}/shot.png`;

export const closeStub = () => new Promise((resolve) => stub.close(resolve));

// Starts the stub and the built server once per test file.
export function useServer() {
  before(async () => {
    stub.listen(0, "127.0.0.1");
    await once(stub, "listening");
    process.env.ATOM_URL = `http://127.0.0.1:${stub.address().port}`;
    process.env.ATOM_TIMEOUT_MS = "150";
    ({ default: mcp } = await import("../.mcp-use/build/index.js"));
    ({ url } = await mcp.listen(0, { host: "127.0.0.1" }));
    directory = await mkdtemp(join(tmpdir(), "atom-mcp-test-"));
    await writeFile(screenshotPath(), Buffer.from(image, "base64"));
  });

  after(async () => {
    await mcp?.close();
    stub.closeAllConnections();
    if (stub.listening) await closeStub();
    if (directory) await rm(directory, { recursive: true });
  });
}

export async function rpc(method, params = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  assert.equal(response.status, 200);
  const text = await response.text();
  const data = response.headers.get("content-type")?.includes("text/event-stream")
    ? text.split("\n").find((line) => line.startsWith("data: ")).slice(6)
    : text;
  const message = JSON.parse(data);
  assert.equal(message.error, undefined, JSON.stringify(message.error));
  return message.result;
}

export const health = () => rpc("tools/call", { name: "atom_health", arguments: {} });

export const ground = (args) => rpc("tools/call", { name: "ground", arguments: { instruction: "click Save", ...args } });

export function error(result, pattern) {
  assert.equal(result.isError, true, JSON.stringify(result.structuredContent));
  assert.match(result.content[0].text, pattern);
  assert.equal(result.structuredContent, undefined);
  assert.equal(result._meta?.imageDataUrl, undefined);
}
