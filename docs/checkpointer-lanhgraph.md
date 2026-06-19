Yes. createReactAgent() supports a checkpointer, and you should use one if you want:

Conversation memory across multiple calls
Resume interrupted executions
Human-in-the-loop workflows
Thread-based conversations
1. Install

For in-memory checkpointing (development):

npm install @langchain/langgraph

For production, use a persistent checkpointer such as Postgres.

2. MemorySaver (Development)
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
});

const checkpointer = new MemorySaver();

export const agent = createReactAgent({
  llm: model,
  tools: [],
  checkpointer,
});
3. Invoke with a Thread ID

The thread_id identifies the conversation.

const result = await agent.invoke(
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

Later:

const result = await agent.invoke(
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

Output:

Your name is Ravi.

Without a checkpointer, the agent would not remember the previous message unless you sent the entire history yourself.

4. PostgreSQL Checkpointer (Production)
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const checkpointer = PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);

await checkpointer.setup();

const agent = createReactAgent({
  llm: model,
  tools,
  checkpointer,
});

Now the conversation survives:

Server restarts
Multiple users
Long-running workflows
5. Execution Flow
User
   │
   ▼
Thread ID
   │
   ▼
Checkpointer
   │
Loads Previous State
   │
   ▼
createReactAgent
   │
   ▼
LLM
   │
   ▼
Tools
   │
   ▼
Save Updated State
   │
   ▼
Response
6. Without vs With Checkpointer
Without
User
   │
   ▼
Agent
   │
   ▼
Response

Next Request
   │
   ▼
Agent

Each request is independent unless you manually pass the full message history.

With
User
   │
   ▼
Checkpointer
   │
Load History
   │
   ▼
Agent
   │
   ▼
Save History
   │
   ▼
Response

The agent automatically loads and saves conversation state for the specified thread_id.

Which checkpointer should you use?
Checkpointer	Best For	Persistent
MemorySaver	Local development, testing	❌ No
PostgresSaver	Production applications	✅ Yes
SqliteSaver (if available in your environment)	Single-machine apps	✅ Yes
Custom checkpointer	Redis, MongoDB, S3, etc.	Depends on implementation