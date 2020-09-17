import {Maybe, nothing, Result, just} from "react-tea-cup";
import {ListResponse} from "bwatch-common";
import {Tab} from "./Tab";
import {Settings} from "./Settings";

export type UpdateStatus
    = { tag: "started", newVersion: string }
    | { tag: "downloaded", newVersion: string }


export interface Model {
    readonly listResponse: Maybe<Result<string,ListResponse>>;
    readonly tab: Tab;
    readonly settings: Maybe<Settings>;
    readonly updateStatus: Maybe<UpdateStatus>;
}

export const initialModel: Model = {
    listResponse: nothing,
    tab: { tag: "builds", filter: nothing },
    settings: nothing,
    updateStatus: nothing
};
