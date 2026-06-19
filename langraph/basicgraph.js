import { createAgent, tool } from "langchain";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();

// --- Tools ---
const getWeather = tool(
    ({ city }) => {
        const normalized = city.toLowerCase();
        if (["sf", "san francisco"].includes(normalized)) {
            return "It's 60 degrees and foggy in San Francisco.";
        }
        return `It's 90 degrees and sunny in ${city}.`;
    },
    {
        name: "get_weather",
        description: "Get the current weather for a given city",
        schema: z.object({
            city: z.string().describe("The city to get the weather for"),
        }),
    }
);

const getAddition = tool(
    ({ input1, input2 }) => `${input1} + ${input2} = ${input1 + input2}`,
    {
        name: "get_addition",
        description: "Add two numbers together",
        schema: z.object({
            input1: z.number().describe("The first number"),
            input2: z.number().describe("The second number"),
        }),
    }
);

// --- Agent ---
// createAgent builds the underlying graph (model node -> tool node -> model node, looped
// until no more tool calls) automatically. No manual StateGraph wiring needed here.
const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather, getAddition],
    apiKey: process.env.OPENAI_API_KEY,
});

// --- Run ---
const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "What's the weather in SF and what's 4+5?",
        },
    ],
});

// --- Inspect what happened ---
console.log("=== Tool calls made ===");
const toolCalls = result.messages
    .filter((msg) => msg instanceof AIMessage)
    .flatMap((msg) => msg.tool_calls ?? []);

toolCalls.forEach((call) => {
    console.log(`- ${call.name}(${JSON.stringify(call.args)})`);
});

console.log("\n=== Tool results ===");
result.messages
    .filter((msg) => msg instanceof ToolMessage)
    .forEach((msg) => console.log(`- [${msg.name}]: ${msg.content}`));

console.log("\n=== Final answer ===");
const lastMessage = result.messages.at(-1);
console.log(lastMessage?.content);