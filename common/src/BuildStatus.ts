import {Decode as D, Decoder, just, Maybe, maybeOf, nothing} from "tea-cup-core";

export type BuildStatus
    = { tag: "none" }
    | { tag: "green", url: string; timeInfo?: TimeInfo }
    | { tag: "red", url: string; timeInfo?: TimeInfo }
    | { tag: "error", err: string };

export interface TimeInfo {
    readonly completedAt: string;
    readonly durationSecs: number;
}

export const BuildStatusNone: BuildStatus = {
    tag: "none"
}

export function green(url: string, timeInfo?: TimeInfo): BuildStatus {
    return {tag: "green", url, timeInfo};
}

export function red(url: string, timeInfo?: TimeInfo): BuildStatus {
    return {tag: "red", url, timeInfo};
}

export function error(err: string): BuildStatus {
    return {tag: "error", err};
}

export const BuildStatusDecoder: Decoder<BuildStatus> =
    D.andThen(
        tag => {
            switch (tag) {
                case "none":
                    return D.succeed(BuildStatusNone);
                case "green":
                    return D.map2(
                        (url, timeInfo) => green(url, timeInfo),
                        D.field("url", D.str),
                        D.optionalField("timeInfo", TimeInfoDecoder)
                    );
                case "red":
                    return D.map2(
                        (url, timeInfo) => red(url, timeInfo),
                        D.field("url", D.str),
                        D.optionalField("timeInfo", TimeInfoDecoder)
                    );
                case "error":
                    return D.map(
                        err => error(err),
                        D.field("err", D.str)
                    );
                default:
                    return D.fail("unhandled tag " + tag);
            }
        },
        D.field("tag", D.str)
    )

export function getBuildUrl(status: BuildStatus): Maybe<string> {
    switch (status.tag) {
        case "green":
        case "red":
            return just(status.url);
        default:
            return nothing;
    }
}

export const TimeInfoDecoder: Decoder<TimeInfo> =
    D.mapObject(
        D.mapRequiredFields({
            completedAt: D.str,
            durationSecs: D.num
        })
    );

export function mapTimeInfo<T>(status: BuildStatus, f: (timeInfo: TimeInfo) => T): Maybe<T> {
    switch (status.tag) {
        case "green":
            return maybeOf(status.timeInfo).map(f);
        case "red":
            return maybeOf(status.timeInfo).map(f);
        default:
            return nothing;
    }
}

