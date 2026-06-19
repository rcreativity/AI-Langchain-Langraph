import { describe, expect, test } from "vitest";
import { tool } from "langchain";
import * as z from "zod";

describe("Retrieve Tool", () => {
    test("returns relevant chunks", async () => {

        const retrieve = tool(
            async ({ query }) => {
                return `Retrieved: ${query}`;
            },
            {
                name: "retrieve",
                schema: z.object({
                    query: z.string(),
                }),
            }
        );

        const result = await retrieve.invoke({
            query: "Task Decomposition",
        });

        expect(result).toContain("Task Decomposition");
    });
});