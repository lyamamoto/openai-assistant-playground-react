class AssistantAPI {
    private _host: string;
    private _port: string;
    private _ssl: boolean;

    constructor(host: string = "127.0.0.1", port: string = "5000", ssl: boolean = false) {
        this._host = host;
        this._port = port;
        this._ssl = ssl;
    }

    private fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
        return fetch(`http${this._ssl ? "s" : ""}://${this._host}:${this._port}${input}`, init);
    }

    async startNewThread() {
        const response = await this.fetch("/thread");
        return await response.text();
    }

    async getMessages(threadId: string) {
        const response = await this.fetch(`/thread/${threadId}/message`);
        return await response.json();
    }

    async addMessage(threadId: string, content: string) {
        const response = await this.fetch(`/thread/${threadId}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: content }),
        });
        return await response.text();
    }

    async runThread(threadId: string) {
        const response = await this.fetch(`/thread/${threadId}/run`, {
            method: "POST",
        });
        return await response.text();
    }

    async getRunStatus(threadId: string, runId: string) {
        const response = await this.fetch(`/thread/${threadId}/run/${runId}/status`);
        return await response.json();
    }
}

export { AssistantAPI };