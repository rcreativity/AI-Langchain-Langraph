import { test, expect } from "vitest";
import { agent } from "../normal-rag.js";

test("real RAG pipeline", async () => {
    const result = await agent.invoke({
        messages: [
            {
                role: "user",
                content: "What is Task Decomposition?",
            },
        ],
    });

    const answer = result.messages.at(-1)?.content;

    expect(answer).toContain("Task");
}, 30000);