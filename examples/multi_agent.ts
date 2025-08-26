import { MultiAgent, createNode } from "../src";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const projectDesc = "Create a fully-functional Space Invader game using TypeScript, HTML, and TailwindCSS. The game should be playable in a modern browser.";

const agent1 = createNode(async (store) => {
    const prompt = `${projectDesc}\n\nYour task: Write the complete TypeScript code for the game logic, including player movement, shooting, enemy behavior, collision detection, and game loop. Output only the TypeScript code.`;
    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
    });
    store.typescript = response.choices[0].message.content;
    return store;
});

const agent2 = createNode(async (store) => {
    const prompt = `${projectDesc}\n\nYour task: Write the complete HTML structure for the game, including a canvas or game area, and any necessary UI elements. Use semantic HTML. Output only the HTML code.`;
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
    });
    store.html = response.choices[0].message.content;
    return store;
});

const agent3 = createNode(async (store) => {
    const prompt = `${projectDesc}\n\nYour task: Write the complete TailwindCSS classes and any custom styles needed for the game. Output only the relevant CSS or Tailwind class usage.`;
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    store.tailwindcss = result.response.text();
    return store;
});

const multiAgent = new MultiAgent();
multiAgent.addAgent(agent1);
multiAgent.addAgent(agent2);
multiAgent.addAgent(agent3);

multiAgent.run({}).then(result => {
    console.log("=== Space Invader Game Artifacts ===");
    console.log("--- TypeScript Game Logic ---\n", result.typescript);
    console.log("--- HTML Structure ---\n", result.html);
    console.log("--- TailwindCSS Styles ---\n", result.tailwindcss);
});
