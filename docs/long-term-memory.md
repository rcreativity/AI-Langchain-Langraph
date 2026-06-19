# createAgent() with Short-Term and Long-Term Memory

This example combines:

* **Short-Term Memory** → Conversation history using a **Checkpointer**
* **Long-Term Memory** → User facts stored in a database via tools


* langmem pip package avaiable for easy integration

Yes, there are packages, but none are as simple as "install package → get ChatGPT-style long-term memory". Most provide building blocks rather than a complete solution.

# AI Memory Packages for LangChain & LangGraph

The following packages can be used to implement short-term and long-term memory in AI agents.

| Package                                    | Purpose                                                           | Short-Term Memory | Long-Term Memory | Recommended Use |
| ------------------------------------------ | ----------------------------------------------------------------- | :---------------: | :--------------: | --------------- |
| `langmem`                                  | Official LangChain long-term memory library                       |         ❌         |         ✅        | ⭐⭐⭐⭐⭐           |
| `@langchain/langgraph`                     | LangGraph workflow engine with checkpointer support               |         ✅         |         ❌        | ⭐⭐⭐⭐⭐           |
| `@langchain/langgraph-checkpoint-postgres` | Persistent checkpointer using PostgreSQL                          |         ✅         |         ❌        | ⭐⭐⭐⭐⭐           |
| `mem0ai`                                   | AI memory platform with automatic memory extraction and retrieval |         ❌         |         ✅        | ⭐⭐⭐⭐            |
| `zep-cloud` / `@getzep/zep-js`             | Managed memory service for AI agents                              |         ✅         |         ✅        | ⭐⭐⭐⭐            |

---

## Quick Comparison

| Package                                    | Best For                         | Storage                    | Automatic Memory Extraction |
| ------------------------------------------ | -------------------------------- | -------------------------- | :-------------------------: |
| `langmem`                                  | Long-term user memory            | Configurable               |              ✅              |
| `@langchain/langgraph`                     | Conversation state               | Memory / Checkpointer      |              ❌              |
| `@langchain/langgraph-checkpoint-postgres` | Persistent conversation history  | PostgreSQL                 |              ❌              |
| `mem0ai`                                   | Personalized AI assistants       | Managed Service / Database |              ✅              |
| `zep-cloud`                                | Production conversational memory | Zep Cloud                  |              ✅              |

---

## Which One Should You Choose?

| Scenario                                               | Recommended Package                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| Conversation memory only                               | `@langchain/langgraph` + `@langchain/langgraph-checkpoint-postgres` |
| Long-term user memory                                  | `langmem`                                                           |
| AI assistant with automatic memory extraction          | `mem0ai`                                                            |
| Managed production memory platform                     | `zep-cloud`                                                         |
| Complete AI assistant (Conversation + Long-Term + RAG) | `@langchain/langgraph` + `langmem` + Vector Database                |


import { createAgent } from "langchain";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const store = PostgresStore.fromConnString(process.env.POSTGRES_URL!);
await store.setup();

const checkpointer = PostgresSaver.fromConnString(process.env.POSTGRES_URL!);
await checkpointer.setup();

const agent = createAgent({
  model,
  tools,
  store,          // Long-term memory
  checkpointer,   // Short-term memory
});

This is the direction the JavaScript ecosystem is moving:

checkpointer → thread/conversation memory
store → persistent long-term memory
Tools access the store through runtime.store to read and write user memories.
---

## Recommended Stack

```text
                    User
                      │
                      ▼
                createAgent()
                      │
      ┌───────────────┼────────────────┐
      ▼               ▼                ▼
 Short-Term      Long-Term           RAG
   Memory          Memory        Knowledge Base
      │               │                │
      ▼               ▼                ▼
LangGraph      langmem /      Vector Database
Checkpointer   mem0 / Zep
```

---

# Architecture

```text
                        User
                          │
                          ▼
                    createAgent()
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
  Short-Term        Long-Term          Other Tools
     Memory            Memory
(Checkpointer)         Tools
        │                 │
        ▼                 ▼
 PostgresSaver      PostgreSQL
                          │
                          ▼
                    Final Response
```

---

# 1. Short-Term Memory (Conversation)

## Setup Checkpointer

```ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);

await checkpointer.setup();
```

---

## Create Agent

```ts
import { createAgent } from "langchain";

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

## Invoke

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
      thread_id: "user-123",
    },
  }
);
```

Later...

```ts
await agent.invoke(
  {
    messages: [
      {
        role: "user",
        content: "What's my name?",
      },
    ],
  },
  {
    configurable: {
      thread_id: "user-123",
    },
  }
);
```

The checkpointer automatically loads the previous conversation for the same `thread_id`.

---

# 2. Long-Term Memory (User Facts)

## Database Table

```sql
CREATE TABLE user_memory (
    id UUID PRIMARY KEY,
    user_id TEXT,
    memory TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
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

    return "Memory saved successfully.";
  },
  {
    name: "remember_memory",
    description: "Store long-term information about the user.",
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

# Create Agent with Both Memories

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

# Example 1 - Short-Term Memory

### User

```text
My favorite color is blue.
```

### Later (same thread)

```text
What's my favorite color?
```

### Flow

```text
User
   │
   ▼
Checkpointer
   │
Loads Conversation
   │
   ▼
Agent
   │
   ▼
Answer
```

No database lookup is required because the information is still in the conversation history.

---

# Example 2 - Long-Term Memory

### User

```text
Remember that I use macOS.
```

### Flow

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

Months later...

```text
Recommend a terminal application.
```

### Flow

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
Database
   │
   ▼
macOS
   │
   ▼
Agent
   │
   ▼
Suggest:
• Ghostty
• Warp
• iTerm2
```

---

# Complete Memory Flow

```text
                      User
                        │
                        ▼
                  createAgent()
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 Short-Term       Long-Term           RAG
   Memory           Memory          Knowledge
(Checkpointer)       Tools
        │               │                │
        ▼               ▼                ▼
 PostgresSaver    PostgreSQL      Vector Database
```

---

# Responsibilities

| Memory              | Purpose                  | Storage                          | Lifetime                      |
| ------------------- | ------------------------ | -------------------------------- | ----------------------------- |
| **Short-Term**      | Conversation history     | PostgresSaver / MemorySaver      | Current conversation (thread) |
| **Long-Term**       | User facts & preferences | PostgreSQL, MongoDB, Redis, etc. | Permanent                     |
| **Knowledge (RAG)** | Documents, PDFs, manuals | Vector Database                  | Permanent                     |

---

# Summary

* **Short-Term Memory**

  * Managed automatically by the **checkpointer**.
  * Uses `thread_id` to restore conversation history.
  * Ideal for multi-turn conversations.

* **Long-Term Memory**

  * Implemented as tools such as `remember_memory` and `search_memory`.
  * Stores durable user facts and preferences in a database.
  * Allows the agent to remember information across conversations.

* **Knowledge Memory (RAG)**

  * Retrieves information from external documents using a vector database.
  * Complements user memory by providing factual knowledge from your document corpus.
