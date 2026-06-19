import { createAgent, tool, humanInTheLoopMiddleware } from "langchain";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import * as z from "zod";
import dotenv from "dotenv";

dotenv.config();
//createReactAgent for langgraph is Deprecated

// tools 
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
    ({ input1, input2 }) => `tool output is ${input1} + ${input2} = ${input1 + input2}`,
    {
        name: "get_addition",
        description: "Add two numbers",
        schema: z.object({
            input1: z.number(),
            input2: z.number(),
        }),
    }
);

//createAgent for langchain and createReactAgent for langgraph is Deprecated
const agent = createAgent({
    model: "gpt-4.1-mini",
    tools: [getWeather, getAddition],
    systemPrompt:
        "When a tool returns a result, output that result to the user exactly as returned — verbatim, no rephrasing, no extra words.",
    apiKey: process.env.OPENAI_API_KEY,
});

// console.log(
//     await agent.invoke({
//         messages: [{ role: "user", content: "What's the weather in San Francisco?" }], // 
//     })
// );

const result = await agent.invoke({
    messages: [{ role: "user", content: "What's 2+6?" }]
})

const toolWasCalled = result.messages.some(
    (msg) => msg instanceof ToolMessage
);
console.log(`Tool was called: ${toolWasCalled}`);

const toolsCalled = result.messages
    .filter((msg) => msg instanceof AIMessage)
    .flatMap((msg) => msg.tool_calls ?? []);

toolsCalled.forEach((tool) => {
    console.log("Tool Name:", tool.name);
    console.log("Arguments:", tool.args);
});

const toolMessage = result.messages.find((msg) => msg instanceof ToolMessage);
console.log(toolMessage?.content);

// console.dir(result, { depth: null });
const lastMessage = result.messages.at(-1);
console.log(`The model's conversational gloss on the result ${lastMessage?.content}`);