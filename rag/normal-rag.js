import "dotenv/config";
import { createAgent, tool } from "langchain";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { z } from "zod";

// ─── 1. LOAD ──────────────────────────────────────────────────────────────────
// Load a webpage — swap CheerioWebBaseLoader for PDFLoader, CSVLoader, etc.
const loader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    { selector: "p" }
);
const docs = await loader.load();
console.log(`Loaded ${docs.length} document(s)`);

// ─── 2. SPLIT ─────────────────────────────────────────────────────────────────
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const chunks = await splitter.splitDocuments(docs);
console.log(`Split into ${chunks.length} chunks`);

// ─── 3. EMBED + STORE ─────────────────────────────────────────────────────────
// MemoryVectorStore = in-memory, no DB needed.
// Swap with Chroma / Pinecone / PGVector for persistence.
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
});
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
console.log("Vector store ready");

// ─── 4. RETRIEVAL TOOL ────────────────────────────────────────────────────────
// Wrap similarity search as a tool so the agent can call it
const retrieve = tool(
    async ({ query }) => {
        const results = await vectorStore.similaritySearch(query, 3);
        return results
            .map((doc) => `Source: ${doc.metadata.source}\n${doc.pageContent}`)
            .join("\n\n---\n\n");
    },
    {
        name: "retrieve",
        description:
            "Search the knowledge base and retrieve relevant context for a query. " +
            "Always use this before answering questions about the document.",
        schema: z.object({
            query: z.string().describe("The search query"),
        }),
    }
);

// ─── 5. AGENT ─────────────────────────────────────────────────────────────────
const agent = createAgent({
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    tools: [retrieve],
    systemPrompt:
        "You are a helpful assistant. Always use the retrieve tool to look up " +
        "information before answering. Cite the source in your response.",
});

// ─── 6. QUERY ─────────────────────────────────────────────────────────────────
const result = await agent.invoke({
    messages: [{ role: "user", content: "What is Task Decomposition?" }],
});

console.log("\n── Answer ──────────────────────────────────");
console.log(result.messages.at(-1).content);