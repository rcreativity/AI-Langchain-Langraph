import { describe, test, expect } from "vitest";
import { agent } from "../../src-testing/agent.js";

describe("Real Agent", () => {
    test(
        "adds numbers",
        async () => {
            const result = await agent.invoke({
                messages: [
                    {
                        role: "user",
                        content: "What's 10 + 5?",
                    },
                ],
            });

            expect(result.messages.at(-1).content)
                .toContain("15");
        },
        30000
    );
});