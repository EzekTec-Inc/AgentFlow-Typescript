export type SharedStore = { [key: string]: any };
export type Node = (store: SharedStore) => Promise<SharedStore>;

export function createNode(fn: Node): Node {
    return fn;
}

export class Agent {
    node: Node;
    maxRetries: number;
    waitMillis: number;

    constructor(node: Node, maxRetries = 1, waitMillis = 0) {
        this.node = node;
        this.maxRetries = maxRetries;
        this.waitMillis = waitMillis;
    }

    async decide(input: SharedStore): Promise<SharedStore> {
        let lastError: any;
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                return await this.node({ ...input });
            } catch (e) {
                lastError = e;
                if (this.waitMillis) await new Promise(res => setTimeout(res, this.waitMillis));
            }
        }
        throw new Error(`Agent failed after retries: ${lastError}`);
    }
}

type Step = { node: Node; name: string };
type Edge = { from: string; action: string; to: string };

export class Workflow {
    steps: Map<string, Node> = new Map();
    edges: Map<string, Map<string, string>> = new Map();
    startStep?: string;

    addStep(name: string, node: Node) {
        if (!this.startStep) this.startStep = name;
        this.steps.set(name, node);
        if (!this.edges.has(name)) this.edges.set(name, new Map());
    }

    connect(from: string, to: string, action = "default") {
        if (!this.edges.has(from)) this.edges.set(from, new Map());
        this.edges.get(from)!.set(action, to);
    }

    async run(store: SharedStore): Promise<SharedStore> {
        let current = this.startStep;
        let state = { ...store };
        while (current) {
            const node = this.steps.get(current);
            if (!node) break;
            state = await node(state);
            const action = state.action || "default";
            current = this.edges.get(current)?.get(action);
        }
        delete state.action;
        return state;
    }
}

export class MultiAgent {
    agents: Node[] = [];
    addAgent(agent: Node) { this.agents.push(agent); }

    async run(store: SharedStore): Promise<SharedStore> {
        const promises = this.agents.map(agent => agent({ ...store }));
        const results = await Promise.all(promises);
        // Merge all results into one store (last write wins)
        return Object.assign({}, store, ...results);
    }
}

export class Rag {
    retriever: Node;
    generator: Node;
    constructor(retriever: Node, generator: Node) {
        this.retriever = retriever;
        this.generator = generator;
    }
    async call(store: SharedStore): Promise<SharedStore> {
        const afterRetrieval = await this.retriever({ ...store });
        return await this.generator(afterRetrieval);
    }
}

export class MapReduce {
    mapper: Node;
    reducer: (stores: SharedStore[]) => Promise<SharedStore>;
    constructor(mapper: Node, reducer: (stores: SharedStore[]) => Promise<SharedStore>) {
        this.mapper = mapper;
        this.reducer = reducer;
    }
    async run(inputs: SharedStore[]): Promise<SharedStore> {
        const mapped = await Promise.all(inputs.map(this.mapper));
        return await this.reducer(mapped);
    }
}
