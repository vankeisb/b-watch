import {Fetch} from "./Fetch";
import {BuildStatus, error, green, red, TimeInfo} from "bwatch-common";
import {Decode as D, Decoder} from "tea-cup-core";
import chalk from "chalk";
import fetch from "node-fetch";

export interface Credentials {
    readonly username: string;
    readonly password: string;
}

export interface BambooConfig {
    readonly serverUrl: string;
    readonly plan: string;
    readonly credentials?: Credentials;
}

const BambooResultDecoder: Decoder<BambooResult> =
    D.mapObject(
        D.mapRequiredFields({
            buildState: D.str,
            lifeCycleState: D.str,
            buildResultKey: D.str,
            buildCompletedTime: D.str,
            buildDuration: D.num,
        }),
    )

interface BambooResult {
    readonly buildState: string;
    readonly lifeCycleState: string;
    readonly buildResultKey: string;
    readonly buildCompletedTime: string;
    readonly buildDuration: number;
}

const BambooResponseDecoder: Decoder<BambooResult> =
    D.at(
        ["results", "result"],
        D.andThen(
            (resArray: BambooResult[]) => {
                if (resArray.length === 0) {
                    return D.fail("no results found in response");
                }
                return D.succeed(resArray[0]);
            },
            D.array(BambooResultDecoder)
        )
    );


export class BambooFetch extends Fetch<BambooConfig> {

    private _canceled: boolean = false;

    constructor(uuid: string, config: BambooConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);

        const {serverUrl, plan, credentials} = config;
        let authPart = "";
        if (credentials) {
            authPart = "os_authType=basic&os_username="
                + encodeURIComponent(credentials.username)
                + "&os_password="
                + encodeURIComponent(credentials.password)
                + "&";
        }

        const planPart = serverUrl
            + "/rest/api/latest/result/"
            + plan
            + ".json";

        const url = planPart
            + "?"
            + authPart
            + "max-results=1&expand=results.result";

        console.log(uuid, "fetching " + chalk.green(planPart))

        fetch(url)
            .then(r => r.text())
            .then(s => {
                if (this._canceled) {
                    return;
                }
                const res = BambooResponseDecoder.decodeString(s);
                switch (res.tag) {
                    case "Ok": {
                        // console.log(uuid, "decoded to", res.value);
                        const {
                            buildState,
                            lifeCycleState,
                            buildResultKey,
                            buildCompletedTime,
                            buildDuration
                        } = res.value;
                        const timeInfo: TimeInfo = {completedAt: buildCompletedTime, durationSecs: buildDuration};
                        // TODO what if not finished ?? for now we just do nothing...
                        if (lifeCycleState === "Finished") {
                            const url = config.serverUrl + "/browse/" + buildResultKey;
                            if (buildState === "Successful") {
                                onResult(green(url, timeInfo));
                            } else {
                                onResult(red(url, timeInfo));
                            }
                        }
                        break;
                    }
                    case "Err": {
                        console.log(uuid, res.err);
                        onResult(error(res.err));
                        break;
                    }
                }
            })
            .catch(e => {
                if (!this._canceled) {
                    console.error(e);
                    onResult(error(e.message));
                }
            });
    }

    cancel(): void {
        this._canceled = true;
    }
}

export const BambooConfigDecoder: Decoder<BambooConfig> =
    D.map2(
        (serverUrl, plan) => ({serverUrl, plan}),
        D.field("serverUrl", D.str),
        D.field("plan", D.str)
    );

