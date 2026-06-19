import { describe, test, expect } from "vitest";
import { getWeather } from "../../src-testing/tools.js";

describe("Weather Tool", () => {
    test("returns weather", async () => {
        const result = await getWeather.invoke({
            city: "Delhi",
        });

        expect(result).toContain("Delhi");
    });
});