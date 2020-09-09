import {BuildInfo, BuildInfoDecoder} from "./BuildInfo";
import {Decode as D, Decoder} from "tea-cup-core/dist/Decode";

export interface ListResponse {
    readonly builds: ReadonlyArray<BuildInfo>
}

export const ListResponseDecoder: Decoder<ListResponse> =
    D.map(
        builds => ({builds}),
        D.field("builds", D.array(BuildInfoDecoder))
    );
