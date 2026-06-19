import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { tool, createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createSwarm, createHandoffTool } from "@langchain/langgraph-swarm";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";

import dotenv from "dotenv";
// short-term memory
const checkpointer = new MemorySaver()
// long-term memory
const store = new InMemoryStore()
// demo not working
dotenv.config();
const model = new ChatOpenAI({ modelName: "gpt-4o" });

// Create specialized tools
const add = tool(
    async (args) => args.a + args.b,
    {
        name: "add",
        description: "Add two numbers.",
        schema: z.object({
            a: z.number(),
            b: z.number()
        })
    }
);

// Create agents with handoff tools
const alice = createAgent({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    tools: [add, createHandoffTool({ agentName: "Bob" })],
    name: "Alice",
    prompt: "You are Alice, an addition expert."
});

const bob = createAgent({
    model,
    apiKey: process.env.OPENAI_API_KEY,
    tools: [createHandoffTool({
        agentName: "Alice",
        description: "Transfer to Alice, she can help with math"
    })],
    name: "Bob",
    prompt: "You are Bob, you speak like a pirate."
});

// Create swarm workflow
const checkpointer = new MemorySaver();
const workflow = createSwarm({
    agents: [alice, bob],
    apiKey: process.env.OPENAI_API_KEY,
    defaultActiveAgent: "Alice"
});

export const app = workflow.compile({
    checkpointer,
    store
});

const config = { configurable: { thread_id: "1" } };
const turn1 = await app.invoke(
    { messages: [{ role: "user", content: "i'd like to speak to Bob" }] },
    config
);
console.log(turn1);

const turn2 = await app.invoke(
    { messages: [{ role: "user", content: "what's 5 + 7?" }] },
    config
);
console.log(turn2);