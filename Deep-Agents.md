# Deep Agents (`deepagents`)

> Batteries-included agent harness built on LangChain + LangGraph for complex, long-running tasks.
> Inspired by Claude Code and Deep Research.

---

## What is Deep Agents?

Deep Agents is an **opinionated agent harness** — same core tool-calling loop as `createAgent`, but with planning, filesystem, subagents, memory, and context management bundled in out of the box.

```
createAgent          →  lightweight, bring your own everything
createDeepAgent      →  batteries included: planning + FS + subagents + memory
LangGraph            →  drop down when you need a fully custom graph shape
```

All three layers compose — any LangGraph `CompiledStateGraph` can be passed as a subagent to a Deep Agent.

---

## Install

```bash
pnpm add deepagents langchain @langchain/core @langchain/openai
```

### Entrypoints

```js
import { createDeepAgent, FilesystemBackend } from "deepagents";         // Node.js (default)
import { createDeepAgent, FilesystemBackend } from "deepagents/node";    // explicit Node.js
import { createDeepAgent, StateBackend } from "deepagents/browser";      // browser-safe
```

---

## Quickstart

```js
import "dotenv/config";
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { z } from "zod";

const getWeather = tool(
  ({ city }) => `It's always sunny in ${city}!`,
  {
    name: "get_weather",
    description: "Get the weather for a given city.",
    schema: z.object({ city: z.string() }),
  }
);

const agent = createDeepAgent({
  tools: [getWeather],
  systemPrompt: "You are a helpful assistant.",
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
});

console.log(result.messages.at(-1).content);
```

---

## Core Capabilities

### 1. 📋 Planning — `write_todos`
Built-in tool that lets the agent decompose tasks, track progress, and adapt as it learns.
- Agent automatically creates a plan before executing complex tasks
- Checks off steps as it completes them
- No configuration needed — bundled by default

```
User: "Research LangGraph and write a summary"
Agent: → write_todos(["1. Search for LangGraph info", "2. Write summary.md"])
       → executes each step in order
```

### 2. 🗂️ Virtual Filesystem
Built-in file tools for context offloading and persistence across steps.

| Tool | Description |
|---|---|
| `ls` | List files |
| `read_file` | Read file contents |
| `write_file` | Write content to a file |
| `edit_file` | Edit an existing file |
| `glob` | Pattern-match files |
| `grep` | Search file contents |

Large tool outputs are automatically offloaded to the filesystem to prevent context window overflow.

### 3. 🤖 Subagents — `task` tool
Spawn specialized, isolated subagents for independent subtasks. Each runs in its own context window and returns only the final result to the parent.

```js
const researchAgent = createDeepAgent({
  name: "researcher",
  systemPrompt: "You are a research specialist.",
  tools: [webSearchTool],
});

const codeAgent = createDeepAgent({
  name: "coder",
  systemPrompt: "You are a coding specialist.",
  tools: [codeExecutorTool],
});

const mainAgent = createDeepAgent({
  model: "gpt-4.1-mini",
  tools: [myTool],
  subagents: [researchAgent, codeAgent],   // ✅ register subagents here
  systemPrompt: "Delegate research to researcher and coding to coder.",
});
```

### 4. 💾 Long-Term Memory
Persistent storage across threads via LangGraph's `BaseStore`.

```js
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";

const agent = createDeepAgent({
  model: "gpt-4.1-mini",
  tools: [],
  checkpointer: new MemorySaver(),    // short-term: per thread
  store: new InMemoryStore(),         // long-term: across threads
});
```

### 5. 🧠 Skills
Load domain knowledge, reusable instructions, or few-shot examples from markdown files.

```
skills/
└── my-skill/
    ├── SKILL.md        ← required: instructions for the agent
    ├── examples.js     ← optional: supporting files
    └── templates/      ← optional: reusable templates
```

```js
const agent = createDeepAgent({
  model: "gpt-4.1-mini",
  tools: [],
  skills: ["./skills/"],              // ✅ path to skills folder
});
```

### 6. 🛑 Human-in-the-Loop (HITL)
Pause execution and wait for human approval before sensitive tool calls.

```js
const agent = createDeepAgent({
  model: "gpt-4.1-mini",
  tools: [writeFileTool, sendEmailTool],
  interruptOn: {
    write_file: true,                 // pause before every file write
    send_email: true,                 // pause before sending emails
  },
  checkpointer: new MemorySaver(),   // ✅ required for HITL
});
```

### 7. 📦 Backends
Controls where files live.

| Backend | Import | Use case |
|---|---|---|
| `FilesystemBackend` | `deepagents` | Local disk (Node.js only) |
| `StateBackend` | `deepagents/browser` | Ephemeral, in agent state |
| `StoreBackend` | `deepagents` | Persistent via LangGraph store |
| `RouterBackend` | `deepagents` | Route paths to different backends |

```js
import { createDeepAgent, FilesystemBackend } from "deepagents";

const agent = createDeepAgent({
  model: "gpt-4.1-mini",
  tools: [],
  backend: new FilesystemBackend({ rootDir: ".", virtualMode: true }),
});
```

---

## Full Config Reference

```js
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

const agent = createDeepAgent({
  // Model — string shorthand or model instance
  model: new ChatOpenAI({ model: "gpt-4.1-mini", temperature: 0 }),

  // Your custom tools (planning + FS tools are always included)
  tools: [myTool1, myTool2],

  // Custom system prompt
  systemPrompt: "You are a research assistant.",

  // Specialized subagents the main agent can delegate to
  subagents: [researchAgent, codeAgent],

  // Custom middleware (e.g. piiMiddleware, summarizationMiddleware)
  middleware: [],

  // Filesystem backend
  backend: new FilesystemBackend({ rootDir: ".", virtualMode: true }),

  // HITL — pause before these tools
  interruptOn: { write_file: true },

  // Skills folder path
  skills: ["./skills/"],

  // Checkpointer for multi-turn + HITL
  checkpointer: new MemorySaver(),

  // Long-term memory store
  store: new InMemoryStore(),
});
```

---

## Streaming

`createDeepAgent` returns a compiled LangGraph graph — full streaming support included.

```js
for await (const step of await agent.stream(
  { messages: [{ role: "user", content: "Research LangGraph" }] },
  { streamMode: "values" }
)) {
  const last = step.messages.at(-1);
  console.log(last.content);
}
```

Subagent streams are available via `stream.subagents` — each delegated task gets its own independent handle.

---

## vs. `createAgent`

| Feature | `createAgent` | `createDeepAgent` |
|---|---|---|
| Tool calling loop | ✅ | ✅ |
| Planning (`write_todos`) | ❌ manual | ✅ built-in |
| Virtual filesystem | ❌ manual | ✅ built-in |
| Subagent spawning | ❌ manual | ✅ built-in |
| Context offloading | ❌ manual | ✅ automatic |
| Long-term memory | ❌ manual | ✅ built-in |
| Skills | ❌ | ✅ |
| HITL | via middleware | ✅ `interruptOn` |
| Prompt caching (Anthropic) | ❌ | ✅ automatic |

---

## When to Use What

```
Simple Q&A, chatbot, basic tool use
  → createAgent

Complex multi-step tasks, research, coding agents, long-running workflows
  → createDeepAgent

Custom graph shape, non-agent loops, fine-grained node control
  → LangGraph StateGraph directly
```

---

## Gotchas

- `deepagents` is pre-1.0 — minor version bumps may include API changes; pin your version
- HITL (`interruptOn`) requires a `checkpointer` — won't work without it
- `FilesystemBackend` is Node.js only — use `StateBackend` for browser
- Planning and filesystem tools are always injected — you cannot remove them
- Prompt caching for Anthropic models is automatic — no config needed
- Any LangGraph `CompiledStateGraph` can be passed as a subagent

---

## Resources

- [Docs](https://docs.langchain.com/oss/javascript/deepagents/overview)
- [npm](https://www.npmjs.com/package/deepagents)
- [GitHub (JS)](https://github.com/langchain-ai/deepagentsjs)
- [GitHub (Python)](https://github.com/langchain-ai/deepagents)