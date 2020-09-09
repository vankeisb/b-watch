import {Config} from "./Config";
import {Fetch} from "./Fetch";
import {BuildStatus} from "./BuildStatus";

export interface BambooConfig extends Config {
    readonly serverUrl: string;
    readonly plan: string;
}

export class BambooFetch extends Fetch<BambooConfig> {

    constructor(uuid: string, config: BambooConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
        console.log(uuid, "bamboo fetch")
        setTimeout(() => {
            console.log(uuid, "got fake result");
            onResult({ tag : "none"} );
        }, 5000)
    }

    cancel(): void {

    }
}
