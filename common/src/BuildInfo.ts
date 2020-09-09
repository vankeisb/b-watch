import {BuildStatus} from "./BuildStatus";

export interface BuildInfo {
    readonly uuid: string;
    readonly info: Info;
    readonly status: BuildStatus;
}

export type Info
    = BambooInfo
    | TravisInfo

export interface TravisInfo {
    readonly tag: "travis";
    readonly repository: string;
    readonly branch: string;
}

export interface BambooInfo {
    readonly tag: "bamboo";
    readonly plan: string;
}
