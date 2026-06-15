import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Build a fresh MCP server with the tools this service exposes. Add your own
// tools here — each is a name, a schema for its inputs, and a handler.
function buildServer() {
  const server = new McpServer({ name: "mcp-server-starter", version: "1.0.0" });

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the text you send.",
      inputSchema: { text: z.string().describe("Text to echo back") },
    },
    async ({ text }) => ({ content: [{ type: "text", text }] })
  );

  server.registerTool(
    "add",
    {
      title: "Add",
      description: "Add two numbers and return the sum.",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] })
  );

  server.registerTool(
    "server_time",
    {
      title: "Server time",
      description: "Return the current server time in ISO-8601.",
      inputSchema: {},
    },
    async () => ({ content: [{ type: "text", text: new Date().toISOString() }] })
  );

  return server;
}

const app = express();
app.use(express.json());

// MCP endpoint, Streamable HTTP transport in stateless mode: a fresh server +
// transport per request, torn down when the response closes. Simple and
// horizontally scalable — no session state to share between instances.
app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless mode has no server-initiated streams, so GET/DELETE aren't used.
const methodNotAllowed = (_req, res) =>
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.get("/", (_req, res) =>
  res.json({
    message: "Remote MCP server (Streamable HTTP). Point an MCP client at /mcp.",
    tools: ["echo", "add", "server_time"],
    docs: "https://dockhold.eu/docs/recipes/deploy-an-mcp-server",
  })
);
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Listen on the port Dockhold assigns, on all interfaces.
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`MCP server listening on ${port} (POST /mcp)`));
