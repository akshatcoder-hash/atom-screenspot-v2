import { MCPServer } from "mcp-use";

const server = new MCPServer({
  name: "atom-mcp",
  title: "Atom GUI grounding",
  version: "0.1.0",
  description: "Screenshot + short instruction -> one click point, from a local Atom API (Apple silicon).",
});

export default server;
