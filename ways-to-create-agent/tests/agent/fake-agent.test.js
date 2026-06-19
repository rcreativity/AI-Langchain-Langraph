import { describe, test, expect } from "vitest";
import { createAgent, fakeModel } from "langchain";
import { AIMessage } from "@langchain/core/messages";
import { getAddition } from "../../src-testing/tools.js";

describe("Fake Agent", () => {
    test("returns mocked response", async () => {
        const model = fakeModel()
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

        expect(result.messages.at(-1).content)
            .toBe("tool output is 2 + 6 = 8");
    });
});