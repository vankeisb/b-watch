import {Result} from "react-tea-cup";
import {ListResponse} from "bwatch-common";

export type Msg
    = { tag: "got-builds"; r: Result<string, ListResponse> }
    | { tag: "got-ws-message"; data: any };


export function gotBuilds(r: Result<string,ListResponse>): Msg {
    return {
        tag: "got-builds",
        r
    }
}

export function gotWsMessage(data: any): Msg {
    return { tag: "got-ws-message", data };
}
