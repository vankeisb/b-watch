import {ListResponse} from "./ListResponse";
import {Task} from "tea-cup-core";

export interface Api {

    list(): Task<string,ListResponse>;

}
