import { Agent, createNode } from "../src";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const orchestratorNode = createNode(async (store) => {
    // Research phase
    const researchPrompt = `You are a research assistant. Research and summarize 5 key facts about ${store.topic} for a software project. Output as a numbered list.`;
    const researchResp = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: researchPrompt }],
    });
    store.research_facts = researchResp.choices[0].message.content;

    // Code phase
    const codePrompt = `You are a senior TypeScript developer. Write a TypeScript function that prints one fun fact about maple syrup, chosen from the following list:\n${store.research_facts}\nOutput only the TypeScript code.`;
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
    const codeResp = await model.generateContent(codePrompt);
    store.typescript_code = codeResp.response.text();

    // Review phase
    const reviewPrompt = `You are a code reviewer. Review the following TypeScript code for correctness and style. Suggest improvements if needed.\n\n${store.typescript_code}`;
    const reviewResp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: reviewPrompt }],
    });
    store.review = reviewResp.choices[0].message.content;

    // Aggregate results
    store.report = [
        "🎯 Orchestrator Report",
        `📚 Research Facts:\n${store.research_facts}`,
        `🧑‍💻 TypeScript Code:\n${store.typescript_code}`,
        `🔍 Review:\n${store.review}`,
        "✅ All phases complete."
    ].join("\n\n");

    return store;
});

const agent = new Agent(orchestratorNode);

agent.decide({ topic: "maple syrup" }).then(result => {
    console.log(result.report);
});
