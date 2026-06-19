import { describe, expect, test } from "vitest";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { FakeEmbeddings } from "@langchain/core/utils/testing";

describe("Vector Store", () => {
    test("stores documents", async () => {
        const embeddings = new FakeEmbeddings();

        const docs = [
            {
                pageContent: "Artificial Intelligence",
                metadata: {},
            },
        ];

        const store = await MemoryVectorStore.fromDocuments(
            docs,
            embeddings
        );

        const results = await store.similaritySearch("AI", 1);

        expect(results.length).toBe(1);

        expect(results[0].pageContent).toContain("Artificial");
    });
});