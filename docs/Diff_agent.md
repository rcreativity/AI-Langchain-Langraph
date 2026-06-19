# createAgent() vs createReactAgent() vs createDeepAgent()

This document compares the three primary agent creation APIs in the LangChain ecosystem.

---

# Quick Comparison

| Feature                      | `createAgent()`  | `createReactAgent()`            | `createDeepAgent()`      |
| ---------------------------- | ---------------- | ------------------------------- | ------------------------ |
| Package                      | `langchain`      | `@langchain/langgraph/prebuilt` | `@langchain/deepagents`  |
| Status                       | ✅ Recommended    | ⚠️ Deprecated                   | ✅ Recommended            |
| Built on LangGraph           | ✅                | ✅                               | ✅                        |
| Reasoning Pattern            | ReAct            | ReAct                           | Plan → Execute → Reflect |
| Tool Calling                 | ✅                | ✅                               | ✅                        |
| MCP Support                  | ✅                | ✅                               | ✅                        |
| RAG Support                  | ✅                | ✅                               | ✅                        |
| Checkpointer                 | ✅                | ✅                               | ✅                        |
| Long-Term Memory (`store`)   | ✅                | ❌                               | ✅                        |
| Middleware                   | ✅                | ❌                               | ✅                        |
| Streaming                    | ✅                | ✅                               | ✅                        |
| Human-in-the-loop            | ✅                | ✅                               | ✅                        |
| Planning                     | Basic            | Basic                           | Advanced                 |
| Reflection                   | ❌                | ❌                               | ✅                        |
| Long-running Tasks           | Limited          | Limited                         | ✅                        |
| Multi-Agent                  | Via `StateGraph` | Via `StateGraph`                | ✅                        |
| Recommended for New Projects | ✅                | ❌                               | ✅ (Autonomous Agents)    |


Deep Agents is an “agent harness”. It is the same core tool calling loop as other agent frameworks, but with built-in capabilities that make agents reliable for real tasks:

deepagents is a standalone library built on top of LangChain’s core building blocks for agents and using LangGraph’s tooling for running agents in production.

An agent harness is the framework or runtime that wraps an LLM and provides it with the capabilities needed to behave like an agent. It's not the AI model itself—it's the infrastructure around the model.

Think of it this way:

LLM
 ↓
Can answer questions

Agent Harness
 ↓
Can use tools
Can keep state
Can call MCP
Can retry
Can plan
Can stream
Can use memory
Can interact with humans

Analogy
Example 1: Car
Engine

can generate power.

Car

adds:

Steering
Brakes
Wheels
Dashboard
Seats

The engine is like the LLM.
The car is like the agent harness.

Example 2: Employee

A person sitting at a desk is like an LLM.

To do real work they need:

Computer
Email
Slack
Browser
Database access
Calendar

That environment is the harness.

const agent = createAgent({
  model,
  tools,
});

createAgent() creates an agent harness.

Internally it manages:

User
 │
 ▼
Agent Harness
 │
 ├── LLM
 ├── Tools
 ├── Memory
 ├── Middleware
 ├── Checkpointer
 ├── Store

 You don't have to implement those pieces yourself.

 In LangGraph
const agent = createReactAgent({
  llm,
  tools,
});

The prebuilt ReAct graph acts as the harness.

User
 │
 ▼
ReAct Harness
 │
 ▼
LLM
 │
 ▼
Tool
 │
 ▼
LLM
In Deep Agents
const agent = createDeepAgent({
  model,
  tools,
});

The harness is more advanced.

Goal
 │
 ▼
Planner
 │
 ▼
Executor
 │
 ▼
Reflection
 │
 ▼
Memory
 │
 ▼
Tools
If you don't use a harness

You must implement everything yourself.

while (true) {
    const response = await llm.invoke(messages);

    if (response.tool_calls) {
        // Execute tools
        // Update messages
        // Handle errors
        // Continue loop
    } else {
        break;
    }
}

You are responsible for:

Tool execution
Message history
State
Retries
Streaming
Memory
Error handling

Summary

An agent harness is the runtime that turns an LLM into a functioning agent by managing the interaction between the model and the rest of the system.

Examples in the LangChain ecosystem:

API	                            Acts as an Agent Harness?
createAgent()	                    ✅
createReactAgent()	              ✅
createDeepAgent()	                ✅
Manual StateGraph	                ✅ (you build the harness)
Raw ChatOpenAI / other LLM call	    ❌
---

# 1. createAgent()

The modern, recommended API for most applications.

```ts
import { createAgent } from "langchain";

const agent = createAgent({
    model,
    tools,
    checkpointer,
    store,
});
```

### Internal Flow

```text
User
 │
 ▼
Model
 │
Need Tool?
├── No ──► Response
└── Yes
      │
      ▼
     Tool
      │
      ▼
    Model
      │
      ▼
  Final Response
```

### Best For

* Chatbots
* AI Assistants
* API integrations
* MCP
* RAG
* Production applications

---

# 2. createReactAgent()

Older LangGraph prebuilt ReAct agent.

```ts
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const agent = createReactAgent({
    llm,
    tools,
});
```

### Internal Flow

```text
User
 │
 ▼
Reason
 │
 ▼
Act (Tool)
 │
 ▼
Observe
 │
 ▼
Reason
 │
 ▼
Answer
```

### Best For

* Existing LangGraph projects
* Learning the ReAct pattern

### Limitations

* Deprecated
* No `store` support
* No middleware support

---

# 3. createDeepAgent()

Autonomous planning agent.

```ts
import { createDeepAgent } from "@langchain/deepagents";

const agent = createDeepAgent({
    model,
    tools,
});
```

### Internal Flow

```text
Goal
 │
 ▼
Planner
 │
 ▼
Task List
 │
 ▼
Executor
 │
 ▼
Reflection
 │
Need More Work?
├── Yes ─► Planner
└── No
      │
      ▼
Final Answer
```

### Best For

* Coding agents
* Research agents
* Autonomous workflows
* Long-running tasks

---

# Architecture Comparison

## createAgent()

```text
User
 │
 ▼
Model
 │
 ▼
Tool
 │
 ▼
Response
```

---

## createReactAgent()

```text
User
 │
 ▼
Reason
 │
 ▼
Tool
 │
 ▼
Observe
 │
 ▼
Reason
 │
 ▼
Response
```

---

## createDeepAgent()

```text
User Goal
 │
 ▼
Planner
 │
 ▼
Task Queue
 │
 ▼
Executor
 │
 ▼
Reflection
 │
 ▼
Planner
 │
 ▼
Final Response
```

---

# Example

## User

```text
Build a weather dashboard.
```

### createAgent()

```text
Call weather API

↓

Answer
```

---

### createReactAgent()

```text
Think

↓

Call weather tool

↓

Observe

↓

Answer
```

---

### createDeepAgent()

```text
Plan

↓

Create Backend

↓

Create Frontend

↓

Write Tests

↓

Reflect

↓

Fix Issues

↓

Complete
```

---

# Feature Matrix

| Capability         | createAgent | createReactAgent | createDeepAgent |
| ------------------ | :---------: | :--------------: | :-------------: |
| Tool Calling       |      ✅      |         ✅        |        ✅        |
| MCP                |      ✅      |         ✅        |        ✅        |
| RAG                |      ✅      |         ✅        |        ✅        |
| Checkpointer       |      ✅      |         ✅        |        ✅        |
| Long-Term Memory   |      ✅      |         ❌        |        ✅        |
| Middleware         |      ✅      |         ❌        |        ✅        |
| Reflection         |      ❌      |         ❌        |        ✅        |
| Planning           |    Basic    |       Basic      |     Advanced    |
| Self-Correction    |      ❌      |         ❌        |        ✅        |
| Long-Running Tasks |   Limited   |      Limited     |        ✅        |

---

# When to Use Which?

| Scenario                | Recommended          |
| ----------------------- | -------------------- |
| Simple chatbot          | `createAgent()`      |
| Tool-calling assistant  | `createAgent()`      |
| Existing ReAct project  | `createReactAgent()` |
| Learning ReAct          | `createReactAgent()` |
| Autonomous coding agent | `createDeepAgent()`  |
| Research agent          | `createDeepAgent()`  |
| Multi-step planning     | `createDeepAgent()`  |
| Production AI assistant | `createAgent()`      |

---

# Learning Path

```text
createAgent()
      │
      ▼
StateGraph
      │
      ▼
createDeepAgent()
```

> **Note:** `createReactAgent()` is mainly relevant for maintaining or understanding older LangGraph examples. For new projects, start with `createAgent()`. Move to `StateGraph` when you need custom orchestration, and use `createDeepAgent()` when you need autonomous planning, reflection, and long-running execution.
