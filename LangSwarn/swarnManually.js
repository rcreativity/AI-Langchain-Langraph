import "dotenv/config";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver, StateGraph } from "@langchain/langgraph";
import { createHandoffTool, addActiveAgentRouter, SwarmState } from "@langchain/langgraph-swarm";

const model = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
});

const add = tool(
    async (args) => String(args.a + args.b),
    {
        name: "add",
        description: "Add two numbers.",
        schema: z.object({ a: z.number(), b: z.number() })
    }
);

const alice = createReactAgent({
    llm: model,
    tools: [add, createHandoffTool({ agentName: "Bob" })],
    name: "Alice",
    prompt: "You are Alice, an addition expert.",
});

const bob = createReactAgent({
    llm: model,
    tools: [createHandoffTool({ agentName: "Alice", description: "Transfer to Alice, she can help with math" })],
    name: "Bob",
    prompt: "You are Bob, you speak like a pirate.",
});

const callAlice = async (state) => {
    const response = await alice.invoke({ messages: state.messages });
    return { messages: response.messages };
};

const callBob = async (state) => {
    const response = await bob.invoke({ messages: state.messages });
    return { messages: response.messages };
};

let workflow = new StateGraph(SwarmState)   // ✅ SwarmState already has messages + activeAgent
    .addNode("Alice", callAlice, { ends: ["Bob"] })
    .addNode("Bob", callBob, { ends: ["Alice"] });

workflow = addActiveAgentRouter(workflow, {
    routeTo: ["Alice", "Bob"],
    defaultActiveAgent: "Alice",
});

export const app = workflow.compile({ checkpointer: new MemorySaver() });

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