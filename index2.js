import { createAgent, tool, humanInTheLoopMiddleware } from "langchain";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver, Command } from "@langchain/langgraph";
import * as z from "zod";
import dotenv from "dotenv";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

dotenv.config();
const checkpointer = new MemorySaver();
const rl = readline.createInterface({ input, output });

const getWeather = tool(
    (input) => `It's always sunny in ${input.city}!`,
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({ city: z.string().describe("The city to get the weather for") }),
    }
);

const getAddition = tool(
    ({ input1, input2 }) => input1 + input2,
    {
        name: "get_addition",
        description: "Add two numbers",
        schema: z.object({ input1: z.number(), input2: z.number() }),
    }
);

const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather, getAddition],
    checkpointer,
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: { get_addition: true },
        }),
    ],
    apiKey: process.env.OPENAI_API_KEY,
});

const config = { configurable: { thread_id: "demo-thread" } };

let result = await agent.invoke(
    { messages: [{ role: "user", content: "What's 360+2222?" }] },
    config
);

// Keep prompting + resuming as long as the graph is paused on an approval
while (result.__interrupt__) {
    const pending = result.__interrupt__[0];
    console.log("\n--- Tool call needs approval ---");
    console.log(JSON.stringify(pending.value, null, 2)); // shows tool name + args

    const answer = (await rl.question("Approve this tool call? (y/n): "))
        .trim()
        .toLowerCase();

    const decisionType = answer === "y" || answer === "yes" ? "approve" : "reject";

    result = await agent.invoke(
        new Command({
            resume: { decisions: [{ type: decisionType }] },
        }),
        config
    );
}

console.log("\nFinal answer:", result.messages.at(-1)?.content);
rl.close();