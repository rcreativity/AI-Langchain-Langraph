import { describe, test, expect } from "vitest";
import { createAgent, fakeModel } from "langchain";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { getAddition } from "../../src-testing/tools.js";

describe("Tool Calling", () => {
    test("executes tool", async () => {
        const model = fakeModel()
            .respond(
                new AIMessage({
                    content: "",
                    tool_calls: [
                        {
                            id: "call1",
                            name: "get_addition",
                            args: {
                                input1: 2,
                                input2: 6,
                            },
                        },
                    ],
                })
            )
            .respond(
                new AIMessage("tool output is 2 + 6 = 8")
            );

        const agent = createAgent({
            model,
            tools: [getAddition],
        });

        const result = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content: "What's 2 + 6?",
                },
            ],
        });

        const toolMessage = result.messages.find(
            (m) => m instanceof ToolMessage
        );

        expect(toolMessage.content)
            .toBe("tool output is 2 + 6 = 8");
    });
});