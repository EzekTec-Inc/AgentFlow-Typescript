import { Workflow, createNode } from "../src";
import OpenAI from "openai";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function promptUser(step: string, result: string): Promise<string> {
    const rl = readline.createInterface({ input, output });
    console.log(`\n--- Step: ${step} ---`);
    console.log(`Result of last processing:\n${result}\n`);
    console.log("Options: [a]pprove, [r]equest revision, [d]eny/restart, [c]ancel");
    return rl.question("Your choice: ").finally(() => rl.close());
}

async function main() {
    const applicantName = "John Doe";
    const propertyDesc = "Plot 40, Maple Estate, Springfield";

    // Step 1: Title Search Agent
    const titleSearchNode = createNode(async (store) => {
        const prompt = `You are a land registry search officer. Perform a title search for the following property: '${propertyDesc}'. List any encumbrances, prior owners, and confirm if the title is clear for transfer.`;
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{ role: "user", content: prompt }],
        });
        store.title_search = response.choices[0].message.content;
        store.action = "default";
        return store;
    });

    // Step 2: Title Issuance Agent
    const titleIssuanceNode = createNode(async (store) => {
        const searchResult = store.title_search || "";
        const prompt = `You are a land registry officer. Based on the following title search result:\n${searchResult}\n\nPrepare a draft land title issuance for applicant '${applicantName}', property '${propertyDesc}'. Include all relevant legal language and conditions.`;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });
        store.title_issuance = response.choices[0].message.content;
        store.action = "default";
        return store;
    });

    // Step 3: Legal Review Agent
    const legalReviewNode = createNode(async (store) => {
        const issuance = store.title_issuance || "";
        const prompt = `You are a legal officer. Review the following draft land title issuance for legal sufficiency, compliance, and clarity. Suggest any corrections or improvements.\n\n${issuance}`;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });
        store.legal_review = response.choices[0].message.content;
        store.action = "default";
        return store;
    });

    // Build the workflow
    const wf = new Workflow();
    wf.addStep("title_search", titleSearchNode);
    wf.addStep("title_issuance", titleIssuanceNode);
    wf.addStep("legal_review", legalReviewNode);
    wf.connect("title_search", "title_issuance");
    wf.connect("title_issuance", "legal_review");

    let currentStep = "title_search";
    let state: any = {};

    while (currentStep) {
        const node = wf.steps.get(currentStep)!;
        state = await node(state);

        // Present result to user and get action
        const stepResult = state[currentStep] || "";
        const userAction = (await promptUser(currentStep, stepResult)).trim().toLowerCase();

        if (userAction === "a" || userAction === "approve") {
            state.action = "default";
            currentStep = wf.edges.get(currentStep)?.get("default") || "";
        } else if (userAction === "r" || userAction === "request revision") {
            state.action = "revise";
            // Rerun the same step
        } else if (userAction === "d" || userAction === "deny" || userAction === "restart") {
            state.action = "default";
            // Rerun the same step
        } else if (userAction === "c" || userAction === "cancel") {
            console.log("Workflow cancelled. Last result:");
            console.log(stepResult);
            return;
        } else {
            console.log("Invalid input, assuming approve.");
            state.action = "default";
            currentStep = wf.edges.get(currentStep)?.get("default") || "";
        }
    }

    console.log("Workflow complete. Final result:");
    Object.entries(state).forEach(([k, v]) => {
        console.log(`${k}: ${v}`);
    });
}

main();
