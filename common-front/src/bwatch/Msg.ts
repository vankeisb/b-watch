import {Result} from "react-tea-cup";
import {ListResponse} from "bwatch-common";
import {Group} from "./Group";
import {TabType} from "./Tab";
import {Settings} from "./Settings";

export type Msg
    = { tag: "got-builds"; r: Result<string, ListResponse> }
    | { tag: "got-ws-message"; data: any }
    | { tag: "reload" }
    | { tag: "open-build", url: string }
    | { tag: "server-ready" }
    | { tag: "tab-clicked", tab: TabType }
    | { tag: "open-group", group: Group }
    | { tag: "close-group" }
    | { tag: "got-settings", settings: Settings }
    | { tag: "toggle-notifications-enabled" }
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
