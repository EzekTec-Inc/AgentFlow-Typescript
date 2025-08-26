import { createNode } from "../src";
import OpenAI from "openai";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function processTopic(topic: string) {
    // Research
    const researchPrompt = `You are a research assistant. List 5 key facts or insights about the topic: '${topic}'.`;
    const researchResp = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: researchPrompt }],
    });
    const research = researchResp.choices[0].message.content;

    // Summarize
    const summaryPrompt = `You are a summarization expert. Summarize the following research into a concise paragraph:\n${research}`;
    const summaryResp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: summaryPrompt }],
    });
    const summary = summaryResp.choices[0].message.content;

    // Critique
    const critiquePrompt = `You are a critical reviewer. Critique the following summary for accuracy, clarity, and completeness. Suggest improvements if needed.\n${summary}`;
    const critiqueResp = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: critiquePrompt }],
    });
    const critique = critiqueResp.choices[0].message.content;

    // Structure output
    const structured = {
        status: "success",
        topic,
        research,
        summary,
        critique,
        timestamp: new Date().toISOString(),
    };

    console.log("=== Structured Output ===");
    console.log(JSON.stringify(structured, null, 2));
    return structured;
}

async function main() {
    let lastTopic = "";
    let lastStructured: any = null;
    const rl = readline.createInterface({ input, output });

    while (true) {
        console.log("\n=== Research & Critique CLI ===");
        console.log("1. Enter new topic to process");
        console.log("2. Revise last response (re-run all agents on last topic)");
        console.log("3. Cancel and show prettified output");
        const choice = await rl.question("Choose an action: ");
        if (choice === "1") {
            const topic = await rl.question("Please enter a topic for research, summary, and critique: ");
            if (!topic.trim()) {
                console.log("No topic entered.");
                continue;
            }
            lastTopic = topic;
            lastStructured = await processTopic(topic);
        } else if (choice === "2") {
            if (!lastTopic) {
                console.log("No previous topic to revise. Please enter a new topic first.");
                continue;
            }
            console.log(`Re-running all agents for last topic: '${lastTopic}'`);
            lastStructured = await processTopic(lastTopic);
        } else if (choice === "3") {
            console.log("\n=== Final Structured Output ===");
            if (lastStructured) {
                console.log(JSON.stringify(lastStructured, null, 2));
            } else {
                console.log("No structured output found.");
            }
            break;
        } else {
            console.log("Invalid choice.");
        }
    }
    rl.close();
}

main();
