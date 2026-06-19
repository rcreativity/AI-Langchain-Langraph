import { describe, expect, test } from "vitest";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

describe("Splitter", () => {
    test("splits documents", async () => {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 100,
            chunkOverlap: 20,
        });

        const docs = [
            {
                pageContent: "hello ".repeat(300),
                metadata: {},
            },
        ];

        const chunks = await splitter.splitDocuments(docs);

        expect(chunks.length).toBeGreaterThan(1);

        expect(chunks[0].pageContent.length).toBeLessThanOrEqual(120);
    });
});