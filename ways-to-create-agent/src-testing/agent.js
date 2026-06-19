import "dotenv/config";
import { createAgent } from "langchain";
import { getWeather, getAddition } from "./tools.js";

export const agent = createAgent({
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    tools: [getWeather, getAddition],
    systemPrompt:
        "When a tool returns a result, return it exactly.",
});