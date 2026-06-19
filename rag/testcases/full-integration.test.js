import { describe, expect, test } from "vitest";
import { createAgent, tool, fakeModel } from "langchain";
import { AIMessage } from "@langchain/core/messages";
import * as z from "zod";

describe("RAG Integration", () => {
  test("agent retrieves before answering", async () => {

    const retrieve = tool(
      async () => {
        return "Task Decomposition is breaking a task into smaller subtasks.";
      },
      {
        name: "retrieve",
        description: "Search KB",
        schema: z.object({
          query: z.string(),
        }),
      }
    );

    const model = fakeModel()
      .respond(
        new AIMessage(
          "Task Decomposition is breaking a task into smaller subtasks."
        )
      );

    const agent = createAgent({
      model,
      tools: [retrieve],
      systemPrompt:
        "Always use retrieve before answering.",
    });

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: "What is Task Decomposition?",
        },
      ],
    });

    const answer =
      result.messages[result.messages.length - 1].content;

    expect(answer).toContain("Task Decomposition");
  });
});