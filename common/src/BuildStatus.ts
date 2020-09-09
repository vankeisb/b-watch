import {Decode as D, Decoder} from "tea-cup-core";

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

export const BuildStatusDecoder: Decoder<BuildStatus> =
    D.andThen(
        tag => {
            switch (tag) {
                case "none":
                    return D.succeed(BuildStatusNone);
                case "green":
                    return D.map(
                        url => green(url),
                        D.field("url", D.str)
                    );
                case "red":
                    return D.map(
                        url => red(url),
                        D.field("url", D.str)
                    );
                case "error":
                    return D.map(
                        err => error(err),
                        D.field("err", D.str)
                    );
                default:
                    return D.fail("unhanlded tag " + tag);
            }
        },
        D.field("tag", D.str)
    )
