export interface Ipc {
    send(channel: string, ...args: any[]): void;
    on(channel: string, f:(args: any[]) => void): void;
}

export type Flags
    = { tag: "browser", version: string, daemonPort: number }
    | { tag: "electron", version: string, daemonPort: number, ipc: Ipc, remoteHost?: string };
