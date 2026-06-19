const agent = createAgent({
  model: "openai:gpt-5.5",
  tools: [
    searchKnowledgeBase,
  ],
});

//searchKnowledgeBase - searchKnowledgeBase.ts
import { tool } from "langchain";
import * as z from "zod";
import { retriever } from "./retriever"; // Your VectorStore retriever

export const searchKnowledgeBase = tool(
  async ({ query }) => {
    // Search the vector database
    const docs = await retriever.invoke(query);

    if (docs.length === 0) {
      return "No relevant documents found.";
    }

    return docs
      .map(
        (doc, index) =>
          `Document ${index + 1}\n${doc.pageContent}`
      )
      .join("\n\n----------------\n\n");
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the company knowledge base for relevant information.",
    schema: z.object({
      query: z.string().describe("Question to search in the knowledge base"),
    }),
  }
);

// retriever.ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const vectorStore = new MemoryVectorStore(
  new OpenAIEmbeddings()
);

// Assume documents are already added

export const retriever = vectorStore.asRetriever({
  k: 5,
});


Invoke
const result = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "What is our leave policy?",
    },
  ],
});

console.log(result.messages.at(-1)?.content);

Flow:

What happens internally?
User:
"What is our leave policy?"

        │
        ▼
createAgent()
        │
        ▼
LLM reasons

"I don't know this.
I should use search_knowledge_base."

        │
        ▼
searchKnowledgeBase Tool
        │
        ▼
Retriever
        │
        ▼
Vector Database
        │
        ▼
Top 5 Documents
        │
        ▼
Tool returns documents
        │
        ▼
LLM reads documents
        │
        ▼
Final Answer