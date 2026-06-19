# Model Context Protocol (MCP)

> Open standard by Anthropic for connecting LLM applications to external tools, data, and services in a consistent, secure way.
> Think of it as **USB-C for AI** — one protocol, any tool, any model.

---

## What Problem Does MCP Solve?

Without MCP, every AI app needs custom glue code for every tool:

```
M apps × N tools = M×N custom integrations  ❌
```

With MCP, any client speaks to any server using one protocol:

```
M apps × N tools = M + N implementations    ✅
```

---

## Architecture

```
┌─────────────────────────────────────┐
│           MCP HOST                  │  ← your app / agent / Claude Desktop
│  ┌─────────────┐  ┌─────────────┐  │
│  │ MCP Client  │  │ MCP Client  │  │  ← one client per server connection
│  └──────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼─────────┘
          │ transport       │ transport
    ┌─────▼──────┐   ┌──────▼─────┐
    │ MCP Server │   │ MCP Server │   ← expose tools, resources, prompts
    │ (local)    │   │ (remote)   │
    └────────────┘   └────────────┘
```

### Roles

| Role | Description |
|---|---|
| **Host** | The app the user interacts with (Claude Desktop, your agent) |
| **Client** | Lives inside the host; manages one server connection |
| **Server** | Exposes capabilities (tools, resources, prompts) to the client |

---

## Three Primitives

### 🔧 Tools
Functions the LLM can **call**. Most common primitive.

```js
server.registerTool(
  "add",
  {
    description: "Add two numbers.",
    inputSchema: z.object({ a: z.number(), b: z.number() }),
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
  })
);
```

### 📄 Resources
Data the LLM can **read** — files, DB records, API responses.

```js
server.registerResource(
  "config://app",
  "Application config file",
  async (uri) => ({
    contents: [{ uri, text: JSON.stringify({ version: "1.0" }) }],
  })
);
```

### 💬 Prompts
Reusable **prompt templates** the host can inject into context.

```js
server.registerPrompt(
  "summarize",
  { description: "Summarize a topic", inputSchema: z.object({ topic: z.string() }) },
  ({ topic }) => ({
    messages: [{ role: "user", content: { type: "text", text: `Summarize: ${topic}` } }],
  })
);
```

---

## Transports

The underlying communication channel between client and server.

### stdio (local)

```
Client spawns server as child process
Communication: stdin / stdout (JSON-RPC newline-delimited)
```

```js
// Server side
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const transport = new StdioServerTransport();
await server.connect(transport);

// Client side
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const transport = new StdioClientTransport({
  command: "node",
  args: ["./mcp-server.js"],
});
```

**Use when:** local tools, CLI agents, dev/testing, VS Code extensions, Claude Desktop config.

### Streamable HTTP (remote) ✅ recommended for production

```
Server runs as always-on HTTP service
Communication: POST (client→server) + optional SSE stream (server→client)
Single endpoint: POST /mcp
```

```js
// Server side (Express)
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
const app = express();
app.use(express.json());
const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
app.post("/mcp", (req, res) => transport.handleRequest(req, res));
await server.connect(transport);
app.listen(8000);

// Client side
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const transport = new StreamableHTTPClientTransport(new URL("http://localhost:8000/mcp"));
```

**Use when:** remote servers, shared tools, cloud deployments, multiple clients.

### SSE ❌ deprecated (March 2025)
Was the original HTTP transport. Replaced by Streamable HTTP. Avoid for new projects.

---

## Lifecycle

```
1. Client spawns / connects to server
2. Handshake — negotiate protocol version + capabilities
3. Client calls listTools() / listResources() / listPrompts()
4. Agent uses tools as needed (callTool, readResource, getPrompt)
5. Client closes → server exits (stdio) or session ends (http)
```

### stdio — server is NOT always running

```
node my-agent.js
    │
    ├── client spawns → node mcp-server.js   ← born here
    │         ↕ JSON-RPC over stdin/stdout
    ├── getTools(), callTool(), ...
    │
    └── client.close() → server exits        ← dies here
```

### http — server IS always running

```
Terminal 1: node mcp-server-http.js    ← keep this running
Terminal 2: node my-agent.js           ← connects over HTTP
```

---

## Communication Protocol

All messages use **JSON-RPC 2.0** encoded as UTF-8.

```json
// Request (client → server)
{ "jsonrpc": "2.0", "id": 1, "method": "tools/call",
  "params": { "name": "add", "arguments": { "a": 3, "b": 5 } } }

// Response (server → client)
{ "jsonrpc": "2.0", "id": 1,
  "result": { "content": [{ "type": "text", "text": "8" }] } }
```

⚠️ With `stdio`: never `console.log()` in the server — stdout is reserved for JSON-RPC. Use `console.error()` for debug logs.

---

## MCP Server (JS)

```js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.registerTool("greet",
  { description: "Greet someone", inputSchema: z.object({ name: z.string() }) },
  async ({ name }) => ({ content: [{ type: "text", text: `Hello, ${name}!` }] })
);

await server.connect(new StdioServerTransport());
```

---

## MCP Client (JS)

```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: "node", args: ["./server.js"] }));

const { tools } = await client.listTools();          // discover tools
const result = await client.callTool({ name: "greet", arguments: { name: "Ravi" } });
console.log(result.content[0].text);                // "Hello, Ravi!"

await client.close();
```

---

## LangChain Adapter (`@langchain/mcp-adapters`)

Converts MCP tools into LangChain-compatible tool objects so you can drop them straight into `createAgent`.

```js
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent } from "langchain";

const client = new MultiServerMCPClient({
  // Local server via stdio
  math: { transport: "stdio", command: "node", args: ["./math-server.js"] },
  // Remote server via http
  weather: { transport: "http", url: "http://localhost:8000/mcp" },
});

const tools = await client.getTools();   // MCP tools → LangChain tools
const agent = createAgent({ model: "gpt-4.1-mini", tools });

await agent.invoke({ messages: [{ role: "user", content: "What is 3 + 5?" }] });

await client.close();
```

### `loadMcpTools` — single server variant

```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { loadMcpTools } from "@langchain/mcp-adapters";

const client = new Client({ name: "client", version: "1.0.0" });
await client.connect(transport);
const tools = await loadMcpTools("math", client);   // tools from one server
```

---

## Install

```bash
# MCP SDK (server + client)
pnpm add @modelcontextprotocol/sdk

# LangChain adapter
pnpm add @langchain/mcp-adapters

# HTTP server (for streamable HTTP transport)
pnpm add express
```

---

## stdio vs http — Quick Comparison

| | stdio | Streamable HTTP |
|---|---|---|
| Server process | Child process (auto-spawned) | Always-running service |
| Run separately? | ❌ never | ✅ yes |
| Network | None (stdin/stdout) | HTTP (port + URL) |
| Multiple clients | ❌ one at a time | ✅ yes |
| Auth support | ❌ | ✅ Bearer, API key, OAuth |
| Production ready | Local only | ✅ yes |
| Best for | Local tools, dev, CLI | Cloud, shared tools, APIs |

---

## Files in This Project

| File | Purpose |
|---|---|
| `mcp-server.js` | MCP server with `add`, `multiply`, `get_weather` tools (stdio) |
| `mcp-client.js` | Raw MCP client — lists and calls tools directly (no LLM) |
| `mcp-agent.js` | `createAgent` wired to MCP tools via `MultiServerMCPClient` |

**Run order:**
```bash
node mcp-client.js    # test server + client (no LLM needed)
node mcp-agent.js     # full agent with GPT routing through MCP tools
```
`mcp-server.js` is never run directly — it is spawned automatically.

---

## Gotchas

- ⚠️ Never `console.log()` in a stdio server — stdout is reserved for JSON-RPC
- `MultiServerMCPClient` is stateless by default — each tool call creates a fresh session
- SSE transport is **deprecated** since March 2025 — use Streamable HTTP instead
- `stdio` cannot be deployed to production (no network access) — use HTTP for cloud
- `package.json` must have `"type": "module"` when using ESM imports
- Server must be running before client connects (http); no need for stdio

---

## Resources

- [MCP Spec](https://modelcontextprotocol.io/specification/2025-11-25)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [LangChain MCP Adapters](https://github.com/langchain-ai/langchain-mcp-adapters)
- [LangChain MCP Docs](https://docs.langchain.com/oss/javascript/langchain/mcp)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)