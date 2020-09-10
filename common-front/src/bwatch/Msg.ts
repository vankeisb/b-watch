import {Result} from "react-tea-cup";
import {ListResponse} from "bwatch-common";

export type Msg
    = { tag: "got-builds"; r: Result<string, ListResponse> };
