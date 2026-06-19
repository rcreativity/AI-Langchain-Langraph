# createAgent() with Short-Term & Long-Term Memory

## Architecture

```text
                     User
                       │
                       ▼
                 createAgent()
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
 Short-Term      Long-Term        Other Tools
   Memory           Memory
(Checkpointer)      Tools
       │               │
       ▼               ▼
 PostgresSaver    PostgreSQL
```

---

# 1. Short-Term Memory

Stores conversation history for a thread.

```ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);

await checkpointer.setup();
```

```ts
const agent = createAgent({
  model: "openai:gpt-5.5",
  tools,
  checkpointer,
});
```

Invoke using a thread ID:

```ts
await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "My name is Ravi",
      },
    ],
  },
  {
    configurable: {
      thread_id: "user-1",
    },
  }
);
```

The next request with the same `thread_id` automatically loads the conversation history.

---

# 2. Long-Term Memory

Create tools that read/write permanent user information.

Example database:

```text
user_memory

id
user_id
memory
created_at
```

---

## rememberMemory Tool

```ts
import { tool } from "langchain";
import * as z from "zod";

export const rememberMemory = tool(
  async ({ userId, memory }) => {

    await db.userMemory.create({
      data: {
        userId,
        memory,
      },
    });

    return "Memory saved.";
  },
  {
    name: "remember_memory",
    description: "Store a long-term user memory.",
    schema: z.object({
      userId: z.string(),
      memory: z.string(),
    }),
  }
);
```

---

## searchMemory Tool

```ts
export const searchMemory = tool(
  async ({ userId, query }) => {

    const memories = await db.userMemory.findMany({
      where: {
        userId,
      },
    });

    return memories
      .map(m => m.memory)
      .join("\n");
  },
  {
    name: "search_memory",
    description: "Retrieve long-term memories about a user.",
    schema: z.object({
      userId: z.string(),
      query: z.string(),
    }),
  }
);
```

---

# 3. Create Agent

```ts
const agent = createAgent({
  model: "openai:gpt-5.5",
  checkpointer,

  tools: [
    rememberMemory,
    searchMemory,
    convertCurrency,
    searchKnowledgeBase,
  ],
});
```

---

# Example 1

User:

```
Remember that I use macOS.
```

Flow:

```text
User
   │
   ▼
Agent
   │
Calls remember_memory
   │
   ▼
Database
```

---

# Example 2

Later...

User:

```
Recommend a terminal emulator.
```

Flow:

```text
User
   │
   ▼
Agent
   │
Needs user preference?
   │
   ▼
search_memory
   │
   ▼
macOS
   │
   ▼
Agent
   │
   ▼
Suggests:
• Ghostty
• Warp
• iTerm2
```

---

# Memory Responsibilities

| Memory | Stores | Technology |
|---------|---------|------------|
| Short-Term | Conversation history | PostgresSaver |
| Long-Term | User facts & preferences | PostgreSQL + Memory Tools |
| Knowledge | PDFs, Docs, Notion | Vector Database (RAG) |

---

# Complete Flow

```text
                     User
                       │
                       ▼
                 createAgent()
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Short-Term      Long-Term         RAG
  Memory           Memory
(Checkpointer)     Tools
        │              │              │
        ▼              ▼              ▼
 PostgresSaver   PostgreSQL     Vector Database
                       │
                       ▼
                 Final Response
```

## Summary

- **Short-term memory**: Managed automatically by the **checkpointer** (`MemorySaver` or `PostgresSaver`) using `thread_id`.
- **Long-term memory**: Implemented as **tools** (`remember_memory`, `search_memory`) backed by a persistent database.
- **Knowledge memory**: Implemented as a **RAG retriever** over a vector database.
- `createAgent()` can use all three simultaneously, deciding when to call long-term memory tools or RAG tools while the checkpointer transparently maintains conversation history.