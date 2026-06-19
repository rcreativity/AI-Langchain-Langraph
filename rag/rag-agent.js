import "dotenv/config";
import { createAgent, tool } from "langchain";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { z } from "zod";

// ─── 1. LOAD + SPLIT + EMBED ──────────────────────────────────────────────────
const loader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    { selector: "p" }
);
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const chunks = await splitter.splitDocuments(docs);

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
});
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
console.log(`✅ Vector store ready — ${chunks.length} chunks indexed`);

// ─── 2. TOOLS ─────────────────────────────────────────────────────────────────

// RAG retrieval tool
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
            "Search the knowledge base for information about AI agents, task decomposition, " +
            "memory, and planning. Use this for any document-related questions.",
        schema: z.object({
            query: z.string().describe("The search query"),
        }),
    }
);

// Weather tool
const getWeather = tool(
    (input) => {
        if (["sf", "san francisco"].includes(input.location.toLowerCase())) {
            return "It's 60 degrees and foggy.";
        } else {
            return "It's 90 degrees and sunny.";
        }
    },
    {
        name: "get_weather",
        description: "Call to get the current weather.",
        schema: z.object({
            location: z.string().describe("Location to get the weather for."),
        }),
    }
);

// Addition tool
const getAddition = tool(
    ({ input1, input2 }) =>
        `tool output is ${input1} + ${input2} = ${input1 + input2}`,
    {
        name: "get_addition",
        description: "Add two numbers.",
        schema: z.object({
            input1: z.number(),
            input2: z.number(),
        }),
    }
);

// ─── 3. AGENT ─────────────────────────────────────────────────────────────────
const agent = createAgent({
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    tools: [retrieve, getWeather, getAddition],
    systemPrompt:
        "You are a helpful assistant with access to three tools:\n" +
        "1. retrieve — search a knowledge base about AI agents\n" +
        "2. get_weather — get current weather for a location\n" +
        "3. get_addition — add two numbers\n\n" +
        "Always use the right tool for the job. " +
        "For document questions, always retrieve before answering. " +
        "Cite sources when using retrieved content.",
});

// ─── 4. QUERIES ───────────────────────────────────────────────────────────────
const queries = [
    "What is Task Decomposition in AI agents?",
    "What's the weather in San Francisco?",
    "What is 42 + 58?",
    "What memory types do AI agents use, and what's the weather in Austin?", // multi-tool
];

for (const query of queries) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`❓ ${query}`);
    console.log("─".repeat(60));

    const result = await agent.invoke({
        messages: [{ role: "user", content: query }],
    });

    console.log(`💬 ${result.messages.at(-1).content}`);
}