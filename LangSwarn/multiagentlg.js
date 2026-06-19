import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";  // ✅ still works, swarm needs this
import { MemorySaver } from "@langchain/langgraph";
import { createSwarm, createHandoffTool } from "@langchain/langgraph-swarm";
import dotenv from "dotenv";

dotenv.config();
const model = new ChatOpenAI({ modelName: "gpt-4.1-mini", temperature: 0 });

const add = tool(
    async (args) => String(args.a + args.b),
    {
        name: "add",
        description: "Add two numbers.",
        schema: z.object({ a: z.number(), b: z.number() })
    }
);

// ✅ createReactAgent is what langgraph-swarm actually supports
const alice = createReactAgent({
    llm: model,
    apiKey: process.env.OPENAI_API_KEY,
    tools: [add, createHandoffTool({ agentName: "Bob" })],
    name: "Alice",
    prompt: "You are Alice, an addition expert."
});

const bob = createReactAgent({
    llm: model,
    apiKey: process.env.OPENAI_API_KEY,
    tools: [
        createHandoffTool({
            agentName: "Alice",
            description: "Transfer to Alice, she can help with math"
        })
    ],
    name: "Bob",
    prompt: "You are Bob, you speak like a pirate."
});

const checkpointer = new MemorySaver();

const workflow = createSwarm({
    agents: [alice, bob],
    defaultActiveAgent: "Alice",
    apiKey: process.env.OPENAI_API_KEY,
});

export const app = workflow.compile({ checkpointer });

const config = { configurable: { thread_id: "1" } };

const turn1 = await app.invoke(
    { messages: [{ role: "user", content: "i'd like to speak to Bob" }] },
    config
);
console.log(turn1.messages.at(-1).content);

const turn2 = await app.invoke(
    { messages: [{ role: "user", content: "what's 5 + 7?" }] },
    config
);
console.log(turn2.messages.at(-1).content);