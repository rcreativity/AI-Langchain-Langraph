#!/usr/bin/env node
// mcp-server.js — run this as a subprocess, communicates via stdin/stdout
// ⚠️  NEVER use console.log() here — stdout is reserved for JSON-RPC.
//      Use console.error() for debug logs instead.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Create server ────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "my-math-weather-server",
    version: "1.0.0",
});

// ─── Register tools ───────────────────────────────────────────────────────────

// Tool 1: Add two numbers
server.registerTool(
    "add",
    {
        description: "Add two numbers together.",
        inputSchema: z.object({
            a: z.number().describe("First number"),
            b: z.number().describe("Second number"),
        }),
    },
    async ({ a, b }) => ({
        content: [{ type: "text", text: String(a + b) }],
    })
);

// Tool 2: Multiply two numbers
server.registerTool(
    "multiply",
    {
        description: "Multiply two numbers together.",
        inputSchema: z.object({
            a: z.number().describe("First number"),
            b: z.number().describe("Second number"),
        }),
    },
    async ({ a, b }) => ({
        content: [{ type: "text", text: String(a * b) }],
    })
);

// Tool 3: Get weather (dummy)
server.registerTool(
    "get_weather",
    {
        description: "Get the current weather for a location.",
        inputSchema: z.object({
            location: z.string().describe("City or location name"),
        }),
    },
    async ({ location }) => {
        const weather =
            ["sf", "san francisco"].includes(location.toLowerCase())
                ? "60°F and foggy"
                : "90°F and sunny";
        return {
            content: [{ type: "text", text: `Weather in ${location}: ${weather}` }],
        };
    }
);

// ─── Connect transport and start ──────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ MCP server running on stdio"); // stderr is safe to use