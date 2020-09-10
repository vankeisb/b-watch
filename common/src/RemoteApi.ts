import {Task, Http} from "tea-cup-core";
import {Api} from "./Api";
import {ListResponse, ListResponseDecoder} from "./ListResponse";

export class RemoteApi implements Api {

    constructor(readonly apiUrl: string) {
    }


    list(): Task<string, ListResponse> {
        return  Http.jsonBody(
            Http.fetch(this.apiUrl),
            ListResponseDecoder
        ).mapError(e => e.message);
    }

}
