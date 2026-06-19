# Agent Creation Methods in LangChain & LangGraph (JavaScript)

There are multiple ways to build AI agents using the LangChain ecosystem. They range from simple single-agent implementations to complex multi-agent workflows with planning and orchestration.

---

# Comparison

| Method                         | Library                           | AI Chooses Tool Calls | Multi-Agent | Best For                       | Complexity |
| ------------------------------ | --------------------------------- | :-------------------: | :---------: | ------------------------------ | :--------: |
| `createAgent()`                | `langchain`                       |           ✅           |      ❌      | General-purpose AI agents      |      ⭐     |
| `createReactAgent()`           | `@langchain/langgraph`            |           ✅           |   Limited   | ReAct-style agents             |     ⭐⭐     |
| `createSupervisor()`           | `@langchain/langgraph-supervisor` |           ✅           |      ✅      | Supervisor-worker architecture |     ⭐⭐⭐    |
| `StateGraph` + `createAgent()` | `@langchain/langgraph`            |           ✅           |      ✅      | Custom workflows               |    ⭐⭐⭐⭐    |
| `StateGraph` + LLM             | `@langchain/langgraph`            |        Optional       |      ✅      | Full control over execution    |    ⭐⭐⭐⭐⭐   |
| Deep Agents                    | `@langchain/deepagents`           |           ✅           |      ✅      | Autonomous planning agents     |    ⭐⭐⭐⭐    |
| Agent Executor *(Legacy)*      | `langchain`                       |           ✅           |      ❌      | Older LangChain applications   |     ⭐⭐⭐    |
| Custom Agent Loop              | Any                               |        Optional       |   Optional  | Research & experimentation     |    ⭐⭐⭐⭐⭐   |

---

# 1. createAgent()

The recommended way to build a modern LangChain agent.

```ts
import { createAgent } from "langchain";

const agent = createAgent({
    model,
    tools,
});
```

### Features

* Tool Calling
* MCP Support
* RAG
* Short-Term Memory
* Long-Term Memory (`store`)
* Streaming

### Best For

* Chatbots
* AI assistants
* API integrations

---

# 2. createReactAgent()

Implements the ReAct (Reason + Act) pattern.

```ts
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const agent = createReactAgent({
    llm,
    tools,
});
```

### Features

* ReAct reasoning
* Automatic tool selection
* Checkpointer support

### Best For

* Reasoning agents
* Tool-using assistants

---

# 3. createSupervisor()

Creates a supervisor that delegates work to specialized agents.

```text
Supervisor
     │
 ┌───┴────┐
 ▼        ▼
Coder   Researcher
```

```ts
const supervisor = createSupervisor({
    agents: [
        codingAgent,
        researchAgent,
    ],
});
```

### Best For

* Multi-agent collaboration
* Team-based AI systems

---

# 4. StateGraph + createAgent()

Each node contains a complete agent.

```text
START
   │
   ▼
Research Agent
   │
Need Coding?
├──No────► END
└──Yes
      │
      ▼
 Coding Agent
      │
      ▼
     END
```

```ts
graph.addNode("research", researchNode);
graph.addNode("coding", codingNode);

graph.addConditionalEdges(...);
```

### Best For

* Conditional routing
* Human approval
* Retry logic
* Complex workflows

---

# 5. StateGraph + LLM

Use the language model directly without `createAgent()`.

```ts
const llm = new ChatOpenAI();

async function node(state) {
    return await llm.invoke(...);
}
```

Everything is implemented manually.

### Best For

* Research projects
* Maximum customization

---

# 6. Deep Agents

Designed for autonomous task execution.

```text
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
Repeat
   │
   ▼
Done
```

```ts
import { createDeepAgent } from "@langchain/deepagents";
```

### Features

* Planning
* Reflection
* Self-correction
* Long-running execution

### Best For

* Autonomous research
* Coding assistants
* Complex automation

---

# 7. Agent Executor (Legacy)

The older LangChain agent interface.

```ts
const executor = new AgentExecutor({
    agent,
    tools,
});
```

### Best For

* Maintaining older LangChain applications

---

# 8. Custom Agent Loop

Implement the entire reasoning loop yourself.

```text
User
   │
   ▼
LLM
   │
Need Tool?
├──No────► Respond
└──Yes
      │
      ▼
Tool
      │
      ▼
LLM
```

```ts
while (true) {

    const response = await llm.invoke(...);

    if (!response.tool_calls) {
        break;
    }

    // Execute tool manually
}
```

### Best For

* Experimental agent architectures
* Custom reasoning pipelines

---

# Feature Comparison

| Feature             | createAgent | createReactAgent | StateGraph | Deep Agents |
| ------------------- | :---------: | :--------------: | :--------: | :---------: |
| Tool Calling        |      ✅      |         ✅        |  Optional  |      ✅      |
| MCP Support         |      ✅      |         ✅        |      ✅     |      ✅      |
| RAG                 |      ✅      |         ✅        |      ✅     |      ✅      |
| Checkpointer        |      ✅      |         ✅        |      ✅     |      ✅      |
| Long-Term Memory    |      ✅      |         ✅        |      ✅     |      ✅      |
| Human Approval      |      ❌      |      Limited     |      ✅     |      ✅      |
| Conditional Routing |      ❌      |      Limited     |      ✅     |      ✅      |
| Multi-Agent         |      ❌      |      Limited     |      ✅     |      ✅      |
| Planning            |    Basic    |       Basic      |   Custom   |   Advanced  |
| Reflection          |      ❌      |         ❌        |   Custom   |      ✅      |

---

# Which One Should You Use?

| Scenario                | Recommendation                                         |
| ----------------------- | ------------------------------------------------------ |
| Simple chatbot          | `createAgent()`                                        |
| Tool-calling assistant  | `createAgent()`                                        |
| ReAct reasoning         | `createReactAgent()`                                   |
| Multi-agent system      | `createSupervisor()` or `StateGraph` + `createAgent()` |
| Human approval workflow | `StateGraph`                                           |
| Autonomous planner      | Deep Agents                                            |
| Full execution control  | `StateGraph` + LLM                                     |

---

# Recommended Learning Path

```text
1. createAgent()
        │
        ▼
2. createReactAgent()
        │
        ▼
3. StateGraph
        │
        ▼
4. createSupervisor()
        │
        ▼
5. Deep Agents
```

---

# Recommended Architecture

```text
                     User
                       │
                       ▼
                 LangGraph
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     createAgent   createReactAgent   Deep Agent
          │            │            │
          └────────────┼────────────┘
                       ▼
                     Tools
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Local Tools    MCP         RAG
```

---

# Summary

* **`createAgent()`** → Best choice for most modern LangChain applications.
* **`createReactAgent()`** → Prebuilt ReAct agent with automatic reasoning and tool use.
* **`createSupervisor()`** → Coordinates multiple specialized agents.
* **`StateGraph + createAgent()`** → Custom workflows with multiple agents and conditional execution.
* **`StateGraph + LLM`** → Complete control over state, routing, and tool execution.
* **Deep Agents** → Autonomous systems with planning, reflection, and self-improvement.
* **Agent Executor** → Legacy API for existing projects.
* **Custom Agent Loop** → Maximum flexibility for research or experimental architectures.
