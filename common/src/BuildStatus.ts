export type BuildStatus
    = { tag: "none" }
    | { tag: "green", url: string }
    | { tag: "red", url: string }
    | { tag: "error", err: string };


export const BuildStatusNone: BuildStatus = {
    tag: "none"
}

export function green(url: string): BuildStatus  {
    return { tag: "green", url };
}

export function red(url: string): BuildStatus  {
    return { tag: "red", url };
}

export function error(err: string): BuildStatus  {
    return { tag: "error", err };
}
