export interface Build {
    readonly config: BuildConfig;
    readonly status: BuildStatus;
}

export type BuildStatus 
    = { tag: "passed" }
    | { tag: "failed" }
    | { tag: "errored", err: Error }


export type BuildConfig 
    = BambooConfig
    | TravisConfig


export interface BambooConfig {
    tag: "bamboo",
    serverUrl: string,
    username: string,
    password: string

}

export interface TravisConfig {
    tag: "travis"
}