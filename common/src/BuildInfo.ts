import {BuildStatus, BuildStatusDecoder} from "./BuildStatus";
import {Decoder, Decode as D} from "tea-cup-core";

export interface BuildInfo {
    readonly tag: "build-info";
    readonly uuid: string;
    readonly info: Info;
    readonly status: BuildStatus;
    readonly groups: readonly string[];
}

export type Info
    = BambooInfo
    | TravisInfo
    | CircleCIInfo

export interface TravisInfo {
    readonly tag: "travis";
    readonly repository: string;
    readonly branch: string;
}

export interface BambooInfo {
    readonly tag: "bamboo";
    readonly plan: string;
}

export interface CircleCIInfo {
    readonly tag: "circleci";
    readonly org: string;
    readonly repo: string;
    readonly branch: string;
}

export const BambooInfoDecoder: Decoder<BambooInfo> =
    D.map(
        plan => ({tag: "bamboo", plan}),
        D.field("plan", D.str)
    );

export const TravisInfoDecoder: Decoder<TravisInfo> =
    D.map2(
        (repository, branch) => ({tag: "travis", repository, branch}),
        D.field("repository", D.str),
        D.field("branch", D.str)
    );

export const CircleCIInfoDecoder: Decoder<CircleCIInfo> =
    D.map3(
        (org, repo, branch) => ({
            tag: "circleci",
            org,
            repo,
            branch
        }),
        D.field("org", D.str),
        D.field("repo", D.str),
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
                case "circleci":
                    return CircleCIInfoDecoder;
                default:
                    return D.fail("unhanlded info tag " + tag)
            }
        },
        D.field("tag", D.str)
    );

export const BuildInfoDecoder: Decoder<BuildInfo> =
    D.map4(
        (uuid, info, status, groups) => ({tag: "build-info", uuid, info, status, groups}),
        D.field("uuid", D.str),
        D.field("info", InfoDecoder),
        D.field("status", BuildStatusDecoder),
        D.oneOf([
            D.field("groups", D.array(D.str)),
            D.succeed([])
        ])
    );
