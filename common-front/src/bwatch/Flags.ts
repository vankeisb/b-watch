export interface Ipc {
    send(channel: string, ...args: any[]): void;
    on(channel: string, f:(args: any[]) => void): void;
}


export type Flags
    = { tag: "browser", daemonPort: number }
    | { tag: "electron", daemonPort: number, ipc: Ipc, remoteHost?: string };
