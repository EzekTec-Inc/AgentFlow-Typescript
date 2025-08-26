import { Agent, createNode } from "../src";
import { openai } from "./openai";

const agentNode = createNode(async (store) => {
    const prompt = store.prompt || "Write a concise and summarized ode to ai in shakespeare";
    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
    });
    store.response = response.choices[0].message.content;
    return store;
});

const agent = new Agent(agentNode, 3, 1000);

agent.decide({ prompt: "Write a concise and summarized ode to ai in shakespeare" }).then(result => {
    console.log("[OpenAI response]:\n", result.response);
});
