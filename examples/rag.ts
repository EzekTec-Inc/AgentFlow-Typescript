import { Rag, createNode } from "../src";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const retriever = createNode(async (store) => {
    const query = store.query;
    const retrievalPrompt = `You are a search assistant. Given the user query: '${query}', retrieve or synthesize a concise context from your knowledge base or the web that would help answer the question.`;
    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: retrievalPrompt }],
    });
    store.context = response.choices[0].message.content;
    return store;
});

const generator = createNode(async (store) => {
    const query = store.query;
    const context = store.context;
    const generationPrompt = `You are an expert assistant. Given the user query: '${query}', and the following context:\n${context}\n\nGenerate a clear, concise, and accurate answer for the user.`;
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: generationPrompt }],
    });
    store.response = response.choices[0].message.content;
    return store;
});

const rag = new Rag(retriever, generator);

rag.call({ query: "What are the main features of Rust for web development?" }).then(result => {
    console.log("User Query:", result.query);
    console.log("[Final Retrieved Context]\n", result.context);
    console.log("[Final Generated Answer]\n", result.response);
});
