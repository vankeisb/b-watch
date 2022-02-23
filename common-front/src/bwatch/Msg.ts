import {Result, Maybe} from "tea-cup-core";
import {ListResponse} from "bwatch-common";
import {Group} from "./Group";
import {TabType} from "./Tab";
import {Settings} from "./Settings";

export type Msg
    = { tag: "got-builds"; r: Result<string, ListResponse> }
    | { tag: "got-ws-message"; data: any }
    | { tag: "reload" }
    | { tag: "open-build", url: string }
    | { tag: "server-ready", err: Maybe<string> }
    | { tag: "tab-clicked", tab: TabType }
    | { tag: "open-group", group: Group }
    | { tag: "close-group" }
    | { tag: "got-settings", settings: Settings }
    | { tag: "toggle-notifications-enabled" }
    | { tag: "toggle-dark-mode" }
    | { tag: "filter-changed", filter: string }
    | { tag: "open-filter" }
    | { tag: "close-filter" }
    | { tag: "update-started", newVersion: string }
    | { tag: "update-downloaded" }
    | { tag: "update-install" }
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
