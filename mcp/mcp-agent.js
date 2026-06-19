// mcp-agent.js — createAgent wired to MCP tools via @langchain/mcp-adapters
import "dotenv/config";
import { createAgent } from "langchain";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 1. MCP Client — connects to one or more MCP servers ─────────────────────
// Each key is a logical server name; tools are loaded from all servers combined.
const mcpClient = new MultiServerMCPClient({
    // Option A: stdio — spawns server as a local subprocess
    mathWeather: {
        transport: "stdio",
        command: "node",
        args: [join(__dirname, "mcp-server.js")],
    },

    // Option B: http — connect to a remote/running server (uncomment to use)
    // remoteServer: {
    //   transport: "http",
    //   url: "http://localhost:8000/mcp",
    // },
});

// ─── 2. Load MCP tools → LangChain-compatible tool objects ───────────────────
// MultiServerMCPClient converts every registered MCP tool into a LangChain tool
const tools = await mcpClient.getTools();
console.log(`✅ Loaded ${tools.length} MCP tools:`);
tools.forEach((t) => console.log(`  • ${t.name}`));
console.log();

// ─── 3. createAgent with MCP tools ───────────────────────────────────────────
const agent = createAgent({
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    tools,                              // ✅ drop MCP tools straight in
    systemPrompt:
        "You are a helpful assistant with access to math and weather tools. " +
        "Always use the right tool for the job.",
});

// ─── 4. Run queries ───────────────────────────────────────────────────────────
const queries = [
    "What is (3 + 5) multiplied by 12?",
    "What's the weather in San Francisco?",
    "Add 99 and 1, then multiply the result by 5.",
];

for (const query of queries) {
    console.log(`❓ ${query}`);
    const result = await agent.invoke({
        messages: [{ role: "user", content: query }],
    });
    console.log(`💬 ${result.messages.at(-1).content}\n`);
}

// ─── 5. Cleanup ───────────────────────────────────────────────────────────────
await mcpClient.close();