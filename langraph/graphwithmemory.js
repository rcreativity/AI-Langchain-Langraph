import { createAgent, tool, humanInTheLoopMiddleware } from "langchain";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver, InMemoryStore, Command } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";
import dotenv from "dotenv";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

dotenv.config();

// --- Checkpointer: short-term memory, scoped to a single thread_id.
// Keeps the running conversation history alive across every turn of the chat loop.
const checkpointer = new MemorySaver();

// --- Store: long-term memory, NOT scoped to a thread.
// Persists facts under a namespace (e.g. per-user) so they'd still be there
// even if you restarted the chat with a new thread_id (as long as the process
// stays alive — InMemoryStore resets on process exit; swap for PostgresStore
// for real persistence across restarts).
const store = new InMemoryStore();

// --- Context schema: passes userId into each invoke() call, available
// inside tools via `runtime.context.userId`.
const contextSchema = z.object({
    userId: z.string(),
});

// --- Tools ---
const getWeather = tool(
    (input) => {
        if (["sf", "san francisco"].includes(input.location.toLowerCase())) {
            return "It's 60 degrees and foggy.";
        } else {
            return "It's 90 degrees and sunny.";
        }
    },
    {
        name: "get_weather",
        description: "Call to get the current weather.",
        schema: z.object({
            location: z.string().describe("Location to get the weather for."),
        }),
    }
);

const getAddition = tool(
    ({ input1, input2 }) => `tool output is ${input1} + ${input2} = ${input1 + input2}`,
    {
        name: "get_addition",
        description: "Add two numbers",
        schema: z.object({
            input1: z.number(),
            input2: z.number(),
        }),
    }
);

// --- Long-term memory tools ---
const SavedFact = z.object({
    fact: z.string().describe("A fact about the user worth remembering long-term"),
});

const saveFact = tool(
    async (input, runtime) => {
        const userId = runtime.context.userId;
        await runtime.store.put(["users", userId], "facts", { fact: input.fact });
        return `Saved: "${input.fact}"`;
    },
    {
        name: "save_fact",
        description: "Save a fact about the user for future conversations (long-term memory)",
        schema: SavedFact,
    }
);

const recallFact = tool(
    async (_input, runtime) => {
        const userId = runtime.context.userId;
        const item = await runtime.store.get(["users", userId], "facts");
        return item?.value ? JSON.stringify(item.value) : "No saved facts yet.";
    },
    {
        name: "recall_fact",
        description: "Recall previously saved facts about the user",
        schema: z.object({}),
    }
);

const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
});

// --- Agent: tools + HITL middleware + checkpointer (short-term) + store (long-term) ---
const agent = createAgent({
    // model: "gpt-4.1-mini",
    model,
    tools: [getWeather, getAddition, saveFact, recallFact],
    contextSchema,
    checkpointer,
    store,
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: { get_addition: true },
        }),
    ],
    apiKey: process.env.OPENAI_API_KEY,
});

// Fixed thread_id and userId for this chat session. In a real app these
// would come from your actual session/auth layer rather than being hardcoded.
const config = {
    configurable: { thread_id: "terminal-chat" },
    context: { userId: "user_123" },
};

const rl = readline.createInterface({ input, output });

console.log("Chat with the agent. Type 'exit' or 'quit' to stop.\n");

while (true) {
    const userInput = await rl.question("You: ");
    const trimmed = userInput.trim();

    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        break;
    }
    if (trimmed === "") {
        continue;
    }

    let result = await agent.invoke(
        { messages: [{ role: "user", content: trimmed }] },
        config
    );

    // Handle any human-in-the-loop approval(s) interactively, looping in case
    // a single turn triggers more than one gated tool call in sequence.
    while (result.__interrupt__) {
        const pending = result.__interrupt__[0];
        console.log("\n[Approval needed for tool call]");
        console.log(JSON.stringify(pending.value, null, 2));

        const answer = (await rl.question("Approve? (y/n): ")).trim().toLowerCase();
        const decisionType = answer === "y" || answer === "yes" ? "approve" : "reject";

        result = await agent.invoke(
            new Command({ resume: { decisions: [{ type: decisionType }] } }),
            config
        );
    }

    const lastMessage = result.messages.at(-1);
    console.log(`\nAgent: ${lastMessage?.content}\n`);
}

console.log("\nGoodbye!");
rl.close();