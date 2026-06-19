import { describe, expect, test } from "vitest";
import { fakeModel } from "langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

describe("Fake Model", () => {
    test("returns mocked responses", async () => {

        const model = fakeModel()
            .respond(new AIMessage("Answer 1"))
            .respond(new AIMessage("Answer 2"));

        const r1 = await model.invoke([
            new HumanMessage("Question")
        ]);

        const r2 = await model.invoke([
            new HumanMessage("Question")
        ]);

        expect(r1.content).toBe("Answer 1");

        expect(r2.content).toBe("Answer 2");
    });
});