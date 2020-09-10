import {BuildInfo, BuildInfoDecoder} from "./BuildInfo";
import {Decode as D, Decoder} from "tea-cup-core/dist/Decode";

export interface ListResponse {
    readonly tag: "list-response"
    readonly builds: ReadonlyArray<BuildInfo>
}

export const ListResponseDecoder: Decoder<ListResponse> =
    D.map(
        builds => ({tag: "list-response", builds}),
        D.field("builds", D.array(BuildInfoDecoder))
    );
