import { Agent, createNode } from "../src";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function llmNode(desc: string) {
    return createNode(async (store) => {
        const prompt = store.prompt || "";
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{ role: "user", content: prompt }],
        });
        store.response = response.choices[0].message.content;
        return store;
    });
}

const agent1 = new Agent(llmNode("poetry"), 2, 500);
const agent2 = new Agent(llmNode("summarization"), 2, 500);

Promise.all([
    agent1.decide({ prompt: "Write a haiku about async Rust." }),
    agent2.decide({ prompt: "Summarize the benefits of concurrency." })
]).then(([result1, result2]) => {
    console.log("Agent 1 (poetry) response:\n", result1.response);
    console.log("Agent 2 (summarization) response:\n", result2.response);
});
