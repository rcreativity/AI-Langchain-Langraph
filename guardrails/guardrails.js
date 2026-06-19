import dotenv from "dotenv";
import { z } from "zod";
import { createAgent, tool, piiMiddleware, humanInTheLoopMiddleware, createMiddleware } from "langchain";

dotenv.config();

// piiMiddleware - Creates a middleware that detects and handles personally identifiable information (PII) in conversations.

// ✅ Common use cases include:
// Preventing PII leakage
// Detecting and blocking prompt injection attacks
// Blocking inappropriate or harmful content
// Enforcing business rules and compliance requirements
// Validating output quality and accuracy

// ✅ Built-in PII types: -
// email: Email addresses
// credit_card: Credit card numbers (validated with Luhn algorithm)
// ip: IP addresses (validated)
// mac_address: MAC addresses
// url: URLs (both http/https and bare URLs)
// ✅ Strategies:-
// block: Raise an exception when PII is detected
// redact: Replace PII with [REDACTED_TYPE] placeholders
// mask: Partially mask PII (e.g., ****-****-****-1234 for credit card)
// hash: Replace PII with deterministic hash (e.g., <email_hash:a1b2c3d4>)

// Prebuilt middleware list - https://docs.langchain.com/oss/javascript/langchain/middleware/built-in

const customerServiceTool = tool(
    async (args) => `Handled card: ${args.card_number}`,
    {
        name: "customer-service",
        description: "Handle customer service inquiries.",
        schema: z.object({ card_number: z.number() })
    }
);

const emailTool = tool(
    async (args) => `Got email: ${args.email}`,
    {
        name: "email-tool",
        description: "Just return the email.",
        schema: z.object({ email: z.string() })
    }
);

const agent = createAgent({
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    tools: [customerServiceTool, emailTool],
    middleware: [
        piiMiddleware("email", { strategy: "redact" }),
        // piiMiddleware("email", { strategy: "mask" }),
        piiMiddleware("credit_card", { strategy: "mask" }),
        // piiMiddleware("url", { strategy: "redact" }),
        // piiMiddleware("ip", { strategy: "hash" }),
        // piiMiddleware("api_key", {
        //     detector: "sk-[a-zA-Z0-9]{32}",
        //     strategy: "block",
        // }),

        // humanInTheLoopMiddleware({
        //     onHumanInTheLoop: async (messages) => {
        //         console.log("Human in the loop triggered. Messages:", messages);
        //         return "Human approved the message.";
        //     },
        // }),

        // contentFilterMiddleware(["hack", "exploit", "malware"]),
    ],
});

const result = await agent.invoke({
    messages: [{
        role: "user",
        content: "My email is john.doe@example.com and card is 5105-1051-0510-5100"
    }]
});

console.log(result.messages.at(-1).content);