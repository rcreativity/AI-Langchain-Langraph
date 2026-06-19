Short-term memory
Short-term memory lets your application remember previous interactions within a single thread or conversation. A thread organizes multiple interactions in a session, similar to the way email groups messages in a single conversation.



Long-term memory
Long-term memory in LangGraph allows systems to retain information across different conversations or sessions. Unlike short-term memory, which is thread-scoped, long-term memory is saved within custom “namespaces.”

# Memory Types in AI Agents

Memory in AI agents is commonly categorized into three types: **Semantic**, **Episodic**, and **Procedural**.

| Memory Type           | What is Stored | Human Example              | Agent Example       |
| --------------------- | -------------- | -------------------------- | ------------------- |
| **Semantic Memory**   | Facts          | Things I learned in school | Facts about a user  |
| **Episodic Memory**   | Experiences    | Things I did               | Past agent actions  |
| **Procedural Memory** | Instructions   | Instincts or motor skills  | Agent system prompt |

---

## Semantic Memory

Stores factual information that doesn't depend on a specific event or time.

### Human Examples

* Things I learned in school
* Paris is the capital of France

### Agent Examples

* The user prefers TypeScript
* The user lives in Bangalore

---

## Episodic Memory

Stores experiences and events that happened in the past.

### Human Examples

* Things I did
* I traveled to Japan last year

### Agent Examples

* Previously searched the knowledge base
* Previously booked a meeting for the user

---

## Procedural Memory

Stores instructions, skills, or rules that define how something should be done.

### Human Examples

* Instincts or motor skills
* Knowing how to ride a bicycle

### Agent Examples

* Agent system prompt
* Tool usage instructions
* Workflow and reasoning strategy

---

# Mapping to LangChain / LangGraph

| Memory Type | Typical Storage                                         | Example                                   |
| ----------- | ------------------------------------------------------- | ----------------------------------------- |
| Semantic    | PostgreSQL, Redis, Graph DB                             | User preferences and facts                |
| Episodic    | LangGraph Checkpointer (`MemorySaver`, `PostgresSaver`) | Conversation history and previous actions |
| Procedural  | System Prompt, Configuration Files, Code                | Agent behavior and instructions           |

---

# Example Architecture

```text
                    User
                      │
                      ▼
                LangGraph Agent
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Semantic      Episodic      Procedural
    Memory         Memory         Memory
(User Facts)   (Conversation) (Instructions)
        │             │             │
 PostgreSQL     Checkpointer   System Prompt
```

