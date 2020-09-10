import {Task, Http} from "tea-cup-core";
import {Api} from "./Api";
import {ListResponse, ListResponseDecoder} from "./ListResponse";

export class RemoteApi implements Api {

    list(): Task<string, ListResponse> {
        return  Http.jsonBody(
            Http.fetch('/api'),
            ListResponseDecoder
        ).mapError(e => e.message);
    }

}
