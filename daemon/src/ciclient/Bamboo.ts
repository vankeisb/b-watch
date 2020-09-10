import {Fetch} from "./Fetch";
import {Config} from "./Config";
import {BuildStatus} from "bwatch-common";
import {Decode as D, Decoder} from "tea-cup-core";
import chalk from "chalk";

export interface BambooConfig extends Config {
    readonly serverUrl: string;
    readonly plan: string;
}

export class BambooFetch extends Fetch<BambooConfig> {

    constructor(uuid: string, config: BambooConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
        console.log(uuid, "bamboo fetch")
        setTimeout(() => {
            console.log(uuid, chalk.red("BAMBOO TODO !!!"));
            onResult({ tag : "none"} );
        }, 5000)
    }

    cancel(): void {

    }
}

export const BambooConfigDecoder: Decoder<BambooConfig> =
    D.map2(
        (serverUrl, plan) => ({ serverUrl, plan}),
        D.field("serverUrl", D.str),
        D.field("plan", D.str)
    );

