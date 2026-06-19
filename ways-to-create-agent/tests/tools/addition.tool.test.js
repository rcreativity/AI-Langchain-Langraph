import { describe, test, expect } from "vitest";
import { getAddition } from "../../src-testing/tools.js";

describe("Addition Tool", () => {
    test("adds numbers", async () => {
        const result = await getAddition.invoke({
            input1: 2,
            input2: 6,
        });

        expect(result).toBe("tool output is 2 + 6 = 8");
    });
});