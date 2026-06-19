import { createAgent, tool, humanInTheLoopMiddleware } from "langchain";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver, Command } from "@langchain/langgraph";
import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();
const checkpointer = new MemorySaver();

const getWeather = tool(
    (input) => `It's always sunny in ${input.city}!`,
    {
        name: "get_weather",
        description: "Get the weather for a given city",
        schema: z.object({
            city: z.string().describe("The city to get the weather for"),
        }),
    }
);

const getAddition = tool(
    ({ input1, input2 }) => `output: ${input1} + ${input2} = ${input1 + input2}`,
    {
        name: "get_addition",
        description: "Add two numbers",
        schema: z.object({
            input1: z.number(),
            input2: z.number(),
        }),
    }
);

const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather, getAddition],
    checkpointer,
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: {
                get_addition: true,
                get_weather: true,
            },
        }),
    ],
    apiKey: process.env.OPENAI_API_KEY,
});

const config = {
    configurable: {
        thread_id: "demo-thread",
    },
};

const result = await agent.invoke(
    {
        messages: [{
            // role: "user", content: "What's the weather in San Francisco?",
            role: "user", content: "What's 2+2",
        },
        ],
    },
    config
);

if (!result.__interrupt__) {
    throw new Error("No interrupt received");
}

// Resume with approve -> this is the call that actually lets get_addition execute
const resumed = await agent.invoke(
    new Command({
        resume: {
            decisions: [
                {
                    type: "reject",
                },
            ],
        },
    }),
    config
);

const toolMessages = resumed.messages.filter((msg) => msg instanceof ToolMessage);
toolMessages.forEach((tm) => {
    console.log("ToolMessage content:", tm.content);
});

const lastMessage = resumed.messages.at(-1);
console.log(lastMessage?.content);