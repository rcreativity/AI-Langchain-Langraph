import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
const model = new ChatOpenAI({
    model: "gpt-4.1-mini",

});

const getWeather = tool((input) => {
    if (["sf", "san francisco"].includes(input.location.toLowerCase())) {
        return "It's 60 degrees and foggy.";
    } else {
        return "It's 90 degrees and sunny.";
    }
}, {
    name: "get_weather",
    description: "Call to get the current weather.",
    schema: z.object({
        location: z.string().describe("Location to get the weather for."),
    })
})

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
const agent = createReactAgent({
    llm: model,
    tools: [getWeather, getAddition],
    apiKey: process.env.OPENAI_API_KEY,
});

const inputs = {
    messages: [{ role: "user", content: "what is the weather in San Francisco or SF?" },],
};

const stream = await agent.stream(inputs, { streamMode: "values" });

for await (const { messages } of stream) {
    // console.log(messages);
    const latest = messages.at(-1);
    console.log(latest.constructor.name, "->", latest.content || latest.tool_calls);
}
// Returns the messages in the state at each step of execution