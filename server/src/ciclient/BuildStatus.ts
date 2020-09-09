export type BuildStatus
    = { tag: "none" }
    | { tag: "green", url: string }
    | { tag: "red", url: string }
    | { tag: "error", err: Error };


export const BuildStatusNone: BuildStatus = {
    tag: "none"
}

export function green(url: string): BuildStatus  {
    return { tag: "green", url };
}

export function red(url: string): BuildStatus  {
    return { tag: "red", url };
}

export function error(err: Error): BuildStatus  {
    return { tag: "error", err };
}
