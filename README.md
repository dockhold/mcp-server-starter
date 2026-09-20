# MCP server starter

A remote [MCP](https://modelcontextprotocol.io) server that deploys to
[Dockhold](https://dockhold.eu) with zero config. It speaks the **Streamable
HTTP** transport, so any MCP client can connect to it over a live HTTPS URL — no
local install. Ships with three example tools (`echo`, `add`, `server_time`).

[![Deploy on Dockhold](https://dockhold.eu/button.svg)](https://app.dockhold.eu/new?repo=https://github.com/dockhold/mcp-server-starter&name=mcp-server-starter&ref=button)

## Deploy it

1. Click **Use this template** (or fork this repo).
2. Click **Deploy to Dockhold** above, or open
   [app.dockhold.eu/new](https://app.dockhold.eu/new), connect GitHub, and pick
   your repo.
3. It goes live at `https://<your-app>.dockhold.app`. The MCP endpoint is
   **`POST /mcp`**.

Dockhold builds the included [`Dockerfile`](Dockerfile). Every push to your main
branch redeploys.

## Deploy with your AI tool

Install the Dockhold plugin or MCP server in your AI coding tool
([setup guide](https://dockhold.eu/docs/recipes/deploy-from-your-ai-tool)), then
say "put this online" in a folder with this template. The tool signs you in
through the browser once and reports the URL when the app is live.

Or from a terminal: `npx dockhold login`, then `npx dockhold deploy`.

## Connect a client

Point any MCP client at `https://<your-app>.dockhold.app/mcp` using the
**Streamable HTTP** transport.

- **MCP Inspector** (quickest test):
  ```bash
  npx @modelcontextprotocol/inspector
  ```
  Choose transport "Streamable HTTP" and enter your `/mcp` URL.
- **Claude Code:**
  ```bash
  claude mcp add --transport http my-server https://<your-app>.dockhold.app/mcp
  ```
- **Other clients:** add it as a remote / HTTP MCP server with the `/mcp` URL.

## Add your own tools

Edit `buildServer()` in [`server.js`](server.js). Each tool is a name, an input
schema (zod), and a handler:

```js
server.registerTool(
  "reverse",
  { title: "Reverse", description: "Reverse a string.", inputSchema: { text: z.string() } },
  async ({ text }) => ({ content: [{ type: "text", text: [...text].reverse().join("") }] })
);
```

It listens on `0.0.0.0:$PORT` and runs stateless (a fresh server per request),
so it scales horizontally with no shared session state.

## Locking it down

The endpoint is **public** by default — anyone with the URL can call your tools.
To require a token, make this a **private app** (Access tab → Private → mint a
token); MCP clients that support custom headers can then send
`Authorization: Bearer <token>`. See the
[full-stack recipe](https://dockhold.eu/docs/recipes/deploy-a-full-stack-app#lock-the-api-down-to-your-app)
for the same private-app pattern, and never expose tools that act on secrets
without auth.

## Run it locally

```bash
npm install
PORT=3000 npm start
# then run the MCP Inspector and connect to http://localhost:3000/mcp
```

## Full walkthrough

[Deploy an MCP server](https://dockhold.eu/docs/recipes/deploy-an-mcp-server) —
the step-by-step recipe.
