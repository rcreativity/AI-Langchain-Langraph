Deep agents use a modular middleware architecture where each core capability is implemented as composable middleware. This design allows you to customize agent behavior by adding, removing, or modifying middleware.

Example 1: Logging
import { createMiddleware } from "langchain";

const logger = createMiddleware({
  name: "Logger",

  wrapModelCall: async (request, handler) => {
    console.log("Prompt:", request.messages);

    const response = await handler(request);

    console.log("Response:", response);

    return response;
  },
});

Example 2: Dynamic Model Selection
const dynamicModel = createMiddleware({
  name: "Dynamic Model",

  wrapModelCall: async (request, handler) => {

    if (request.messages.length > 20) {
      request.model = advancedModel;
    }

    return handler(request);
  },
});

Example:

Short conversation → GPT-4.1 Mini
Long conversation → GPT-5.5

Example 3: Tool Approval
const approval = createMiddleware({
  name: "Approval",

  wrapToolCall: async (request, handler) => {

    if (request.toolCall.name === "delete_user") {
      throw new Error("Approval required");
    }

    return handler(request);
  },
});
Example 4: Measure Execution Time
const timer = createMiddleware({
  name: "Timer",

  wrapModelCall: async (request, handler) => {

    const start = Date.now();

    const result = await handler(request);

    console.log(Date.now() - start);

    return result;
  },
});
Middleware Execution Order
const agent = createAgent({
    model,
    middleware: [
        logger,
        timer,
        approval,
    ],
});

Flow:

User
 │
 ▼
Logger
 │
 ▼
Timer
 │
 ▼
Approval
 │
 ▼
Model
 │
 ▼
Tool
 │
 ▼
Response

Middleware executes in the order it's registered.

Available Middleware Hooks

The exact set of hooks evolves with LangChain, but commonly used ones include:

Hook	            Purpose
wrapModelCall	    Intercept LLM requests/responses
wrapToolCall	    Intercept tool execution
wrapModelResponse	Inspect or modify model output
beforeAgent	        Run before agent execution (where supported)
afterAgent	        Run after agent execution (where supported)