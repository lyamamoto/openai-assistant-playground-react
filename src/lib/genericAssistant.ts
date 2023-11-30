import OpenAI from "openai";

const openai = new OpenAI({ apiKey: "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", dangerouslyAllowBrowser: true, });

interface AssistantParams {
    name: string,
    company: {
        name: string,
        type: string,
        pronoun: "M" | "F",
        services: string,
    },
    playNames?: string[],
    mood?: {
        friendly?: boolean,
        aggressive?: boolean,
        polite?: boolean,
        unpolite?: boolean,
        kind?: boolean,
        inclusive?: boolean,
    },
    conversationFlow: string[],
    outOfContext?: {
        allowed?: boolean,
        pushBack?: boolean,
        friendly?: boolean,
    }
}

const generateNames = (): string[] => {
    return ["João", "José", "Gabriel", "Lucas", "Felipe", "Paulo", "Pedro", "Maria", "Ana", "Luísa", "Alessandra", "Joana", "Cris", "Marcela"];
}

class GenericAssistant {
    private _ready: boolean = false;
    private _assistant: OpenAI.Beta.Assistant | null = null;
    private _threads: {[threadId: string]: OpenAI.Beta.Thread} = {};

    get ready(): boolean { return this._ready; }

    constructor(params: AssistantParams | string) {
        (async () => {
            this._assistant = (typeof(params) === "string") ?
                await openai.beta.assistants.retrieve(params) :
                await openai.beta.assistants.create({
                    name: params.name,
                    instructions: `Você é um agente de call center que trabalha em ${params.company.type} que se chama ${params.company.name} (referia-se sempre no ${params.company.pronoun === "M" ? "masculino" : "feminino"}) que possui o seguinte serviço: ${params.company.services}.
                    Escolha aleatóriamente dentro da lista a seguir o seu nome: ${(params.playNames && params.playNames.length > 0 ? params.playNames : generateNames()).join(", ")}. Você usará este nome para se apresentar ao cliente.
                    Voce deve atender as pessoas de maneira ${!params.mood ? "neutra" : `${params.mood.friendly ? "cordial" :  params.mood.aggressive ? "agressiva" : "seca"}, ${params.mood.polite ? "formal" : params.mood.unpolite ? "muito informal" : "sem muita formalidade"}, tratando-as sempre de uma forma ${params.mood.kind ? "gentil" : "mesquinha"}${params.mood.inclusive && " e inclusiva"}`}.
                    ${params.conversationFlow.join("\n")}
                    ${params.outOfContext !== undefined && `Se a conversa parecer estar totalmente fora de contexto, ${params.outOfContext.allowed ? "continue conversando com o cliente dentro do assunto que o cliente está puxando." : `expresse isso de forma ${params.outOfContext.friendly ? "amigável" : "ríspida"} explicando porque a conversa parece estar fora do contexto, ${params.outOfContext.pushBack && " e trazendo imediatamente de volta ao contexto inicial proposto."}`}`}
                    `,
                    tools: [{"type": "code_interpreter"}, {"type": "retrieval"}],
                    model: "gpt-3.5-turbo-1106",
                });
        })().then(() => { this._ready = true; });
    }

    async startNewThread(): Promise<OpenAI.Beta.Thread | null> {
        if(this._ready) {
            const newThread = await openai.beta.threads.create();
            this._threads[newThread.id] = newThread;
            return newThread;
        }
        return null;
    }

    async addMessage(threadId: string, content: string): Promise<OpenAI.Beta.Threads.Messages.ThreadMessage | null> {
        if(this._ready) {
            const message = await openai.beta.threads.messages.create(
                threadId,
                {
                    role: "user",
                    content,
                }
            );
            return message;
        }
        return null;
    }

    async runThread(threadId: string): Promise<OpenAI.Beta.Threads.Runs.Run | null> {
        if(this._ready) {
            const run = await openai.beta.threads.runs.create(
                threadId,
                { assistant_id: this._assistant?.id ?? "", }
            );

            const retrieve = async (): Promise<OpenAI.Beta.Threads.Runs.Run> => {
                return (async () =>  await openai.beta.threads.runs.retrieve(
                    threadId,
                    run.id,
                ))().then(async (retrieval) => {
                    return ["queued", "in_progress"].indexOf(retrieval.status) !== -1 ?
                        (async (data?) =>
                            new Promise((resolve) => setTimeout(() => resolve(data), 1500)).then(retrieve))()
                        : retrieval
                });
            }

            return await retrieve();
        }
        return null;
    }

    async getMessages(threadId: string): Promise<OpenAI.Beta.Threads.Messages.ThreadMessage[] | null> {
        if(this._ready) {
            const messages = await openai.beta.threads.messages.list(threadId);
            return messages.data;
        }
        return null;
    }
}

export { GenericAssistant };