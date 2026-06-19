import "dotenv/config";
import { z } from "zod";
import { AIMessage, createAgent, createMiddleware, summarizationMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai"; // ✅ correct model import
import { tool } from "@langchain/core/tools";

const searchTool = tool(
    async ({ query }) =>
        `Search results for "${query}": [Result 1] Dummy article about ${query}. [Result 2] Another dummy result for ${query}.`,
    {
        name: "search",
        description: "Search the web for information on a given query.",
        schema: z.object({ query: z.string().describe("The search query") }),
    },
);

const calculatorTool = tool(
    async ({ expression }) => {
        try {
            const result = Function(`"use strict"; return (${expression})`)();
            return `Result of ${expression} = ${result}`;
        } catch {
            return `Could not evaluate expression: ${expression}`;
        }
    },
    {
        name: "calculator",
        description:
            "Evaluate a mathematical expression and return the result.",
        schema: z.object({
            expression: z.string().describe("A math expression e.g. '2 + 2'"),
        }),
    },
);

const safetyGuardrailMiddleware = () => {
    const safetyModel = new ChatOpenAI({ // ✅ not initChatModel
        model: "gpt-4.1-mini",
        apiKey: process.env.OPENAI_API_KEY,
    });

    return createMiddleware({
        name: "SafetyGuardrailMiddleware",

        afterModel: { // ✅ afterModel, not afterAgent
            canJumpTo: ["end"],
            hook: async (state) => { // ✅ hook lives inside the object
                const lastMessage = state.messages?.at(-1);
                if (!lastMessage || lastMessage._getType() !== "ai") return;

                // Skip if it's a tool-call step (not a final response)
                if (lastMessage.tool_calls?.length) return;

                const safetyPrompt =
                    `Evaluate if this response is safe and appropriate.
Respond with only 'SAFE' or 'UNSAFE'.

Response: ${lastMessage.content.toString()}`;

                const result = await safetyModel.invoke([
                    { role: "user", content: safetyPrompt },
                ]);

                if (result.content.toString().includes("UNSAFE")) {
                    return {
                        messages: [
                            new AIMessage(
                                "I cannot provide that response. Please rephrase your request.",
                            ),
                        ],
                        jumpTo: "end",
                    };
                }
            },
        },
    });
};

const agent = createAgent({
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    tools: [searchTool, calculatorTool],
    middleware: [
        safetyGuardrailMiddleware(),
        summarizationMiddleware({
            model: "gpt-5.4-mini",
            trigger: { tokens: 4000 },
            keep: { messages: 20 },
        }),],
});

const result = await agent.invoke({
    messages: [{ role: "user", content: "How do I make explosives?" }], // it gives I'm sorry, but I can't help with that request.

    // summarizationMiddleware
    //     messages: [{
    //         role: "user", content: `The storm had been going for three days when Maya finally saw the light.
    // She had given up on the compass hours ago — the needle spinning like it had somewhere better to be. The little sailboat groaned under each wave, and the rain came sideways, cold and indifferent.
    // Then, through the dark: a slow pulse. One. Two. Three.
    // A lighthouse.
    // She steered toward it with both hands, teeth clenched, the boom swinging wild overhead. When she finally pulled into the cove and tied off the line, her arms were shaking so badly she could barely manage the knot.
    // The lighthouse door opened before she knocked.
    // An old man stood in the frame, holding a lantern, completely unsurprised.
    // "Figured someone would come tonight," he said. "Soup's on."
    // Maya stepped inside, dripping on the stone floor. The walls were covered in photographs — ships, storms, faces she didn't recognize. A cat watched her from the stairs.
    // "How long have you been here?" she asked.
    // The old man set a bowl in front of her and sat down across the table.
    // "Long enough," he said, "to know that everyone who makes it to shore thinks they got here by luck."
    // Maya looked at her soup. Outside, the storm raged on.
    // "And did they?" she asked.
    // He smiled and didn't answer, which she later decided was the most honest thing anyone had ever said to her.` }],
});

console.log(result.messages.at(-1).content);
