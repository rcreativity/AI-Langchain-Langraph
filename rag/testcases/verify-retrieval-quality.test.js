import { test, expect } from "vitest";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { FakeEmbeddings } from "@langchain/core/utils/testing";

test("retrieves correct document", async () => {
    const docs = [
        {
            pageContent:
                "Task Decomposition is breaking a large task into smaller subtasks.",
            metadata: {},
        },
        {
            pageContent:
                "ReAct combines reasoning and acting.",
            metadata: {},
        },
    ];

    const embeddings = new FakeEmbeddings();

    const vectorStore = await MemoryVectorStore.fromDocuments(
        docs,
        embeddings
    );

    const results = await vectorStore.similaritySearch(
        "Task Decomposition",
        1
    );

    expect(results.length).toBe(1);
    expect(results[0].pageContent).toContain("Task Decomposition");
});