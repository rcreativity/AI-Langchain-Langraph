// mcp-client.js — connects to the MCP server and lists/calls tools directly
// Use this to test the server without an agent

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Connect to MCP server via stdio ─────────────────────────────────────────
// StdioClientTransport spawns mcp-server.js as a child process
const transport = new StdioClientTransport({
    command: "node",
    args: [join(__dirname, "mcp-server.js")],
});

const client = new Client({
    name: "my-mcp-client",
    version: "1.0.0",
});

await client.connect(transport);
console.log("✅ Connected to MCP server\n");

// ─── List available tools ─────────────────────────────────────────────────────
const { tools } = await client.listTools();
console.log("📦 Available tools:");
tools.forEach((t) => console.log(`  • ${t.name} — ${t.description}`));
console.log();

// ─── Call: add ────────────────────────────────────────────────────────────────
const addResult = await client.callTool({
    name: "add",
    arguments: { a: 12, b: 30 },
});
console.log("➕ add(12, 30):", addResult.content[0].text);

// ─── Call: multiply ───────────────────────────────────────────────────────────
const mulResult = await client.callTool({
    name: "multiply",
    arguments: { a: 6, b: 7 },
});
console.log("✖️  multiply(6, 7):", mulResult.content[0].text);

// ─── Call: get_weather ────────────────────────────────────────────────────────
const weatherResult = await client.callTool({
    name: "get_weather",
    arguments: { location: "San Francisco" },
});
console.log("🌤️  get_weather(SF):", weatherResult.content[0].text);

// ─── Cleanup ──────────────────────────────────────────────────────────────────
await client.close();
console.log("\n✅ Done");