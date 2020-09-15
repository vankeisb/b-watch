import {Result} from "react-tea-cup";
import {ListResponse} from "bwatch-common";
import { Tab } from "./BWatch";

export type Msg
    = { tag: "got-builds"; r: Result<string, ListResponse> }
    | { tag: "got-ws-message"; data: any }
    | { tag: "reload" }
    | { tag: "open-build", url: string }
    | { tag: "server-ready" }
    | { tag: "tab-clicked", tab: Tab }
    | { tag: "noop" };


export function gotBuilds(r: Result<string,ListResponse>): Msg {
    return {
        tag: "got-builds",
        r
    }
}

export function gotWsMessage(data: any): Msg {
    return { tag: "got-ws-message", data };
}
