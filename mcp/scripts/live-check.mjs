// Renders a known page, asks a running atom-mcp (backed by a real Atom API) to find each element,
// and counts the clicks that land inside that element's box. macOS + Chrome.
// usage: node scripts/live-check.mjs   (MCP_URL defaults to http://localhost:3000/mcp)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3000/mcp";
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTH = 1280;
const HEIGHT = 800;

// [instruction, render(style) -> element, [x, y, width, height]]
const targets = [
  ["click the Save button", (s) => `<button style="${s}">Save</button>`, [840, 100, 140, 44]],
  ["click the Cancel button", (s) => `<button style="${s}">Cancel</button>`, [1000, 100, 140, 44]],
  ["click Delete invoice", (s) => `<button style="${s};background:#c0392b;color:#fff;border:0">Delete invoice</button>`, [840, 170, 300, 44]],
  ["click the search box", (s) => `<input style="${s}" placeholder="Search invoices">`, [880, 12, 360, 32]],
  ["click Download PDF", (s) => `<a style="${s};line-height:22px" href="#">Download PDF</a>`, [24, 420, 106, 22]],
];

const at = ([x, y, w, h]) => `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:16px;box-sizing:border-box`;
const page = `<!doctype html><body style="margin:0;width:${WIDTH}px;height:${HEIGHT}px;background:#f4f4f6;font:16px -apple-system,sans-serif">
${targets.map(([, render, box]) => render(at(box))).join("\n")}`;

const dir = mkdtempSync(join(tmpdir(), "atom-live-check-"));
writeFileSync(join(dir, "page.html"), page);
execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--force-device-scale-factor=1", "--hide-scrollbars",
  `--user-data-dir=${join(dir, "profile")}`, `--window-size=${WIDTH},${HEIGHT}`,
  `--screenshot=${join(dir, "shot.png")}`, `file://${join(dir, "page.html")}`,
], { stdio: "ignore" });

async function ground(instruction) {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "ground", arguments: { instruction, image_path: join(dir, "shot.png") } },
    }),
  });
  const text = await response.text();
  return JSON.parse(text.split("\n").find((line) => line.startsWith("data: "))?.slice(6) ?? text).result;
}

let hits = 0;
for (const [instruction, , [x, y, w, h]] of targets) {
  const result = await ground(instruction);
  if (result.isError) {
    console.log(`ERROR  ${instruction}: ${result.content[0].text}`);
    continue;
  }
  const { pixel, duration_ms } = result.structuredContent;
  const hit = pixel.x >= x && pixel.x <= x + w && pixel.y >= y && pixel.y <= y + h;
  hits += hit;
  console.log(`${hit ? "HIT  " : "MISS "} ${instruction.padEnd(26)} (${Math.round(pixel.x)}, ${Math.round(pixel.y)})  ${duration_ms} ms`);
}
console.log(`${hits}/${targets.length} inside the element's box`);
process.exitCode = hits === targets.length ? 0 : 1;
