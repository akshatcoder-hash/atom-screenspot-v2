import { MCPServer } from "mcp-use";
import { z } from "zod";
import * as atom from "./src/atom.js";
import { readScreenshot } from "./src/screenshot.js";

const server = new MCPServer({
  name: "atom-mcp",
  title: "Atom GUI grounding",
  version: "0.1.0",
  description: "Screenshot + short instruction -> one click point, from a local Atom API (Apple silicon).",
  instructions:
    "Call `ground` with a short imperative instruction (e.g. 'click the Save button') and a screenshot " +
    "(exactly one of: absolute image_path, or image_base64). Returns the click point in 0-1000 normalized and " +
    "pixel coordinates. Atom may abstain; do not retry with a reworded wrapper, just rephrase the target.",
});

export const atomHealth = server.tool(
  {
    name: "atom_health",
    title: "Atom health",
    description: "Check that the local Atom API is up. Returns its /health response.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => {
    const health = await atom.health();
    return { content: [{ type: "text", text: JSON.stringify(health) }], structuredContent: health };
  },
);

export const ground = server.tool(
  {
    name: "ground",
    title: "Ground a click",
    description:
      "Given a screenshot and a short imperative instruction, return the single point to click " +
      "(normalized 0-1000 and pixel coords). Provide exactly one of image_path (absolute local path) or " +
      "image_base64. Atom may abstain when it cannot find a point.",
    inputSchema: z.object({
      instruction: z.string().trim().min(1).max(4000).describe("Short imperative, e.g. 'click the Save button'. Do not add a prompt wrapper."),
      image_path: z.string().optional().describe("Absolute local path to a PNG, JPEG, or WebP screenshot"),
      image_base64: z.string().optional().describe("Base64 PNG, JPEG, or WebP screenshot, bare or as a data URL"),
    }),
    outputSchema: atom.click.extend({ instruction: z.string() }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ instruction, image_path, image_base64 }) => {
    const screenshot = await readScreenshot(image_path, image_base64);
    const result = await atom.ground(instruction, screenshot.base64);
    const { pixel, image, normalized, duration_ms } = result;
    return {
      content: [
        {
          type: "text",
          text: `click at pixel (${Math.round(pixel.x)}, ${Math.round(pixel.y)}) of ${image.width}x${image.height}; normalized (${normalized.x}, ${normalized.y}); ${duration_ms}ms`,
        },
      ],
      structuredContent: { ...result, instruction },
    };
  },
);

export default server;
