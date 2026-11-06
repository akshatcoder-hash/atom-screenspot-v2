import { MCPServer } from "mcp-use";
import { z } from "zod";
import * as atom from "./src/atom.js";

const server = new MCPServer({
  name: "atom-mcp",
  title: "Atom GUI grounding",
  version: "0.1.0",
  description: "Screenshot + short instruction -> one click point, from a local Atom API (Apple silicon).",
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

export default server;
