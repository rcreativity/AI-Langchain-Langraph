import { describe, expect, test } from "vitest";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

describe("Loader", () => {
    test("loads webpage", async () => {
        const loader = new CheerioWebBaseLoader(
            "https://lilianweng.github.io/posts/2023-06-23-agent/",
            { selector: "p" }
        );

        const docs = await loader.load();

        expect(docs.length).toBeGreaterThan(0);

        expect(docs[0].pageContent.length).toBeGreaterThan(50);
    });
});