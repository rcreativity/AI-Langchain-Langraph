import { tool } from "langchain";
import * as z from "zod";

export const getWeather = tool(
    ({ city }) => `It's always sunny in ${city}!`,
    {
        name: "get_weather",
        description: "Get weather",
        schema: z.object({
            city: z.string(),
        }),
    }
);

export const getAddition = tool(
    ({ input1, input2 }) =>
        `tool output is ${input1} + ${input2} = ${input1 + input2}`,
    {
        name: "get_addition",
        description: "Add numbers",
        schema: z.object({
            input1: z.number(),
            input2: z.number(),
        }),
    }
);