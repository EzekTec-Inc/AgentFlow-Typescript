import { MapReduce, createNode } from "../src";
import { openai } from "./openai.1";
const docs = [
    "Rust is a systems programming language.",
    "Async programming enables concurrency.",
    "LLMs are transforming software development.",
];

const mapper = createNode(async (store) => {
    const doc = store.doc;
    const prompt = `Summarize: ${doc}`;
    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
    });
    store.summary = response.choices[0].message.content;
    return store;
});

const reducer = async (stores) => {
    const allSummaries = stores.map(s => s.summary).join("\n");
    return { all_summaries: allSummaries };
};

const mapReduce = new MapReduce(mapper, reducer);

mapReduce.run(docs.map(doc => ({ doc }))).then(result => {
    console.log("All Summaries:\n", result.all_summaries);
});
