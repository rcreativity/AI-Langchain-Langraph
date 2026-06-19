# Tool Integration Methods in LangChain & LangGraph

This document summarizes the common ways to connect tools to an AI agent.

---

# 1. Native LangChain Tools (Simplest)

Use when your tools are implemented directly in your application.

```ts
import { createAgent, tool } from "langchain";

const weatherTool = tool(
  async ({ city }) => {
    return `Weather in ${city} is 30°C`;
  },
  {
    name: "weather",
    description: "Get weather information",
    schema: WeatherSchema,
  }
);

const agent = createAgent({
  model: "openai:gpt-5.5",
  tools: [weatherTool],
});
```

### Flow

```
User
   │
   ▼
Agent
   │
   ▼
Local Tool
   │
   ▼
Response
```

---

# 2. MCP Server (Recommended for External Tools)

Use when tools run in separate processes or services.

```ts
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const client = new MultiServerMCPClient({
  weather: {
    transport: "stdio",
    command: "node",
    args: ["dist/weather-server.js"],
  },
});

const tools = await client.getTools();

const agent = createAgent({
  model: "openai:gpt-5.5",
  tools,
});
```

### Flow

```
User
   │
   ▼
Agent
   │
   ▼
MCP Client
   │
   ▼
MCP Server
   │
   ▼
Tool Result
   │
   ▼
Response
```

---

# 3. LangGraph + createAgent

Use LangGraph to orchestrate workflows while `createAgent()` handles reasoning and tool calling.

```ts
const researchAgent = createAgent({
  model: "openai:gpt-5.5",
  tools,
});

async function researchNode(state) {
  return await researchAgent.invoke({
    messages: state.messages,
  });
}
```

### Flow

```
START
   │
   ▼
LangGraph
   │
   ▼
createAgent()
   │
   ▼
Tool
   │
   ▼
END
```

---

# 4. LangGraph with Manual Tool Nodes

Use when you need complete control over execution.

```ts
graph.addNode("agent", agentNode);
graph.addNode("tools", toolNode);

graph.addConditionalEdges(
  "agent",
  shouldContinue,
  {
    tools: "tools",
    [END]: END,
  }
);

graph.addEdge("tools", "agent");
```

### Flow

```
START
   │
   ▼
Agent
   │
Tool?
├── No ──► END
└── Yes
      │
      ▼
    Tool Node
      │
      ▼
    Agent
```

---

# 5. Manual Tool Calling (No Agent)

The application decides which tool to call.

```ts
const weather = await weatherTool.invoke({
  city: "Mumbai",
});
```

### Flow

```
Application
      │
      ▼
Call Tool
      │
      ▼
Result
```

---

# Comparison

| Method                      | AI Decides Tool? | Custom Workflow        | Best For                         |
| --------------------------- | ---------------- | ---------------------- | -------------------------------- |
| `tool()` + `createAgent()`  | ✅                | ❌                      | Chatbots, assistants             |
| MCP Server                  | ✅                | ❌                      | External services, microservices |
| LangGraph + `createAgent()` | ✅                | ✅                      | Multi-agent systems              |
| LangGraph + Manual Nodes    | Optional         | ✅                      | Complex workflows                |
| Manual Tool Call            | ❌                | Application-controlled | APIs, backend logic              |

---

# Which One Should You Use?

| Scenario                               | Recommended                 |
| -------------------------------------- | --------------------------- |
| Simple chatbot                         | `createAgent()`             |
| Local tools                            | `tool()`                    |
| External APIs/services                 | MCP Server                  |
| Multi-agent workflow                   | LangGraph + `createAgent()` |
| Human approval                         | LangGraph                   |
| Custom routing                         | LangGraph                   |
| Full control over execution            | Manual Tool Nodes           |
| Backend automation without AI deciding | Manual Tool Calls           |

---

# Summary Architecture

```
                 User
                   │
                   ▼
            LangGraph (Optional)
                   │
                   ▼
             createAgent()
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Local Tools           MCP Tools
        │                     │
        ▼                     ▼
     Function          MCP Server(s)
        │                     │
        └──────────┬──────────┘
                   ▼
              Final Response
```
