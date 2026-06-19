import { agent } from "./agent.js";

const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "What's 2 + 6?",
        },
    ],
});

console.log(result.messages.at(-1).content);