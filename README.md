# LangChain & LangGraph & Deep Agents ([Link](./Deep-Agents.md)) (via Example Learning)

> Last updated: June 2026

---

## ✅ Completed
### RAG

# How it works — 3 phases

```text
INDEXING (runs once)          RETRIEVAL + GENERATION (runs per query)
──────────────────            ──────────────────────────────────────
Load URL / PDF / CSV          User asks question
        ↓                            ↓
Load documents                Agent calls retrieve()
        ↓                            ↓
Split into chunks             similaritySearch() → Top 3 chunks
        ↓                            ↓
Create embeddings             Retrieve relevant chunks
        ↓                            ↓
Store in Vector Store         LLM gets:
                              • User question
                              • Retrieved chunks
                                      ↓
                                Generate answer
```

---

# Swap out pieces as needed

| Part             | Current                          | Alternatives                                                 |
| ---------------- | -------------------------------- | ------------------------------------------------------------ |
| **Loader**       | `CheerioWebBaseLoader`           | `WebBaseLoader`, `PDFLoader`, `CSVLoader`, `DirectoryLoader` |
| **Splitter**     | `RecursiveCharacterTextSplitter` | `TokenTextSplitter`, `MarkdownTextSplitter`                  |
| **Embeddings**   | `text-embedding-3-small`         | `text-embedding-3-large`, `Cohere`, `Mistral`, `Ollama`      |
| **Vector Store** | `MemoryVectorStore`              | `Chroma`, `FAISS`, `Pinecone`, `PGVector`, `Qdrant`          |
| **Retriever**    | `similaritySearch()`             | `asRetriever()`, `MMR Retriever`, `MultiQueryRetriever`      |
| **Model**        | `gpt-4.1-mini`                   | Any `createAgent()` compatible model                         |

---

# Simple Flow

```text
                INDEXING (One Time)

Website / PDF / CSV
         │
         ▼
     Document Loader
         │
         ▼
    Split into Chunks
         │
         ▼
  Create Embeddings
         │
         ▼
    Vector Database


────────────────────────────────────────────


      RETRIEVAL + GENERATION (Every Query)

      User Question
            │
            ▼
        retrieve()
            │
            ▼
   similaritySearch()
            │
            ▼
   Top K Relevant Chunks
            │
            ▼
 Question + Retrieved Chunks
            │
            ▼
            LLM
            │
            ▼
       Final Answer
```

### 🛡️ Guardrails
- `piiMiddleware` — single middleware instance with `types[]` and `customDetectors`
- `safetyGuardrailMiddleware` — custom `createMiddleware` with `afterModel` hook
- Content filtering and blocking unsafe responses with `jumpTo: "end"`
- Middleware naming rules — each middleware can only be registered once
- Middleware list - https://reference.langchain.com/python/deepagents/middleware

### 🔗 LangChain (v1)
- `createAgent` — new API replacing deprecated `createReactAgent` from LangGraph
- `systemPrompt` — renamed from `prompt`
- `tool()` — from `@langchain/core/tools`
- `piiMiddleware` — unified rules object with regex patterns (`/g` flag required)
- `createMiddleware` — custom middleware with lifecycle hooks:
  - `beforeAgent` / `afterAgent`
  - `beforeModel` / `afterModel` → `{ canJumpTo, hook }` shape
  - `wrapModelCall` / `wrapToolCall`
- `AIMessage`, `HumanMessage` imports from `langchain`
- dotenv setup for ESM — `import "dotenv/config"` as first line

### 🧠 LangGraph (v1)
- `StateGraph` — manual graph construction with `addNode`, `addEdge`
- `Annotation.Root` — custom state schema definition
- `messagesStateReducer` — reducer for message state
- `MemorySaver` — in-memory checkpointer for multi-turn conversations
- `createReactAgent` — still required for swarm/supervisor (known compatibility issue)
- Version pinning — `@langchain/langgraph ^1.3.1+` required for SwarmState compatibility

### 👔 LangGraph Supervisor (`@langchain/langgraph-supervisor`)
- `createSupervisor` — orchestrates multiple agents with a supervisor LLM
- Agent name alignment — supervisor prompt must reference exact agent `name` values
- `llm` + `prompt` + `agents[]` config
- Compiling with `workflow.compile({ checkpointer })`

### 🐝 LangGraph Swarm (`@langchain/langgraph-swarm`)
- `createSwarm` — high-level swarm builder (requires `createReactAgent`, not `createAgent`)
- `createHandoffTool` — handoff between agents by name
- `SwarmState` — built-in state schema with `messages` + `activeAgent` keys
- `addActiveAgentRouter` — manual swarm wiring with `StateGraph`
- Multi-turn memory via `MemorySaver` checkpointer on `workflow.compile()`
- Known bug: `createAgent` (LangChain v1) incompatible with `langgraph-swarm` — use `createReactAgent` ([issue #1739](https://github.com/langchain-ai/langgraphjs/issues/1739))

### 💾 Long-Term Memory
- `MemorySaver` — short-term, in-process memory (lost on restart)
- `thread_id` in `configurable` — scopes memory to a conversation thread
- Multi-turn invocation pattern — same `config` object passed across turns

---

## 🔲 To Cover

### ✳️ LangGraph Checkpoint Validation (`langgraph-checkpoint-validation`)
- Validating checkpoint schemas
- Custom checkpoint validators
- Error handling for invalid state transitions

### ✳️ `@langchain/react`
- React bindings for LangChain agents
- Streaming responses in UI
- Integrating agent state with React component state
- `useAgent` / `useLangGraph` hooks (if available)

### ✳️ @langchain/langgraph-checkpoint-postgres (long term memory and chekpointer)

### ✳️ langgraph-checkpoint-mongodb (long term memory and chekpointer)

### ✳️ @langchain/langgraph-checkpoint-redis (long term memory and chekpointer)

### ✳️ @langchain/langgraph-checkpoint-sqlite (long term memory and chekpointer)

### MCP ([Link](./mcp.md))
-  MCP (Model Context Protocol) like MCP = USB-C for AI applications.
-  MCP (Model Context Protocol) is a standard protocol that lets AI models securely connect to external tools, data sources, and services using a common interface.
- MCP (Model Context Protocol) types - 1️⃣ MCP Host, 2️⃣ MCP Client, 3️⃣ MCP Server
- ✳️ 1️⃣ MCP Host - The application that uses MCP 🕵Eg. Claude Desktop, Cursor, VS Code, ChatGPT (future integrations)
- ✳️ 2️⃣ MCP Client - Connects the host to one or more MCP servers 🕵Eg. Requests available tools, resources, and prompts
- ✳️ 3️⃣ MCP Host - Exposes tools, resources, and prompts to the client 🕵Eg. Filesystem Server, GitHub Server, PostgreSQL Server

```
                MCP Architecture

+----------------+
|    MCP Host    |
| (Claude/Cursor)|
+-------+--------+
        |
        |
+-------v--------+
|   MCP Client   |
+-------+--------+
        |
        |
+-------v------------------------------+
|             MCP Server               |
|                                      |
|  • Tools                             |
|  • Resources                         |
|  • Prompts                           |
+--------------------------------------+
```


### ✳️ MCP Server (Completed)
- MCP Server - 1️⃣ Tools (Functions the AI can execute Eg. Run SQL, Call API), 2️⃣ Resources (Data the AI can read Eg. Documents, Database rows, Logs), 3️⃣ Prompts (Reusable prompt templates Eg. Code review, SQL generation)
- Setting up a Model Context Protocol server
- Exposing tools and resources over MCP
- Transport options — `stdio`, `sse (Server-Sent Events)`, `http`, `Streamable HTTP`
- Tool schema definition for MCP
- Connecting MCP server to LangGraph agents

### ✳️ MCP Client (Completed)
- An MCP Client is the component that communicates with an MCP Server on behalf of the AI application.
- Connecting to an MCP server from LangChain/LangGraph
- `MultiServerMCPClient` — managing multiple MCP server connections
- Loading MCP tools into a LangGraph agent
- Authentication and session management
- Error handling and reconnection strategies

---

## 📦 Package Reference

| Package | Version | Notes |
|---|---|---|
| `langchain` | `^1.x` | `createAgent`, `createMiddleware`, `piiMiddleware` |
| `@langchain/core` | `^1.1.44+` | `tool`, `BaseMessage`, `AIMessage` |
| `@langchain/openai` | latest | `ChatOpenAI` |
| `@langchain/langgraph` | `^1.3.1+` | `StateGraph`, `MemorySaver`, `createReactAgent` |
| `@langchain/langgraph-swarm` | `^1.0.2` | `createSwarm`, `SwarmState`, `createHandoffTool` |
| `@langchain/langgraph-supervisor` | latest | `createSupervisor` |
| `dotenv` | latest | Use `import "dotenv/config"` in ESM |

---

## ⚠️ Gotchas & Key Lessons

- **`createAgent` vs `createReactAgent`** — `createAgent` is v1, but swarm/supervisor still need `createReactAgent`
- **Tool return types must be strings** — wrap with `String(...)` to avoid type errors
- **Middleware registered once** — can't use the same middleware class twice; combine rules into one instance
- **dotenv in ESM** — `import "dotenv/config"` must be the absolute first import
- **`SwarmState` version mismatch** — upgrade all `@langchain/*` packages together with `pnpm add ... @latest`
- **Supervisor prompt must use exact agent names** — `math_expert` not `math_agent`
- **`afterModel` hook shape** — must be `afterModel: { canJumpTo: [...], hook: async (state) => {} }`
- **Tool-call guard in safety middleware** — skip `jumpTo: "end"` if `lastMessage.tool_calls?.length > 0`