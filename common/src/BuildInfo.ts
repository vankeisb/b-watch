import {BuildStatus, BuildStatusDecoder} from "./BuildStatus";
import {Decoder, Decode as D } from "tea-cup-core";

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

export const BambooInfoDecoder: Decoder<BambooInfo> =
    D.map(
        plan => ({tag: "bamboo", plan}),
        D.field("plan", D.str)
    );

export const TravisInfoDecoder: Decoder<TravisInfo> =
    D.map2(
        (repository, branch) => ({tag: "travis", repository, branch }),
        D.field("repository", D.str),
        D.field("branch", D.str)
    );

export const InfoDecoder: Decoder<Info> =
    D.andThen(
        tag => {
            switch (tag) {
                case "bamboo":
                    return BambooInfoDecoder;
                case "travis":
                    return TravisInfoDecoder;
                default:
                    return D.fail("unhanlded info tag " + tag)
            }
        },
        D.field("tag", D.str)
    );

export const BuildInfoDecoder: Decoder<BuildInfo> =
    D.map3(
        (uuid, info, status) => ({uuid, info, status}),
        D.field("uuid", D.str),
        D.field("info", InfoDecoder),
        D.field("status", BuildStatusDecoder)
    )
