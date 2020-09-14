import {Fetch} from "./Fetch";
import {BuildStatus, error, green, red} from "bwatch-common";
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
    D.map3(
        (buildState, lifeCycleState, buildResultKey) => ({ buildState, lifeCycleState, buildResultKey }),
        D.field("buildState", D.str),
        D.field("lifeCycleState", D.str),
        D.field("buildResultKey", D.str)
    );

interface BambooResult {
    readonly buildState: string;
    readonly lifeCycleState: string;
    readonly buildResultKey: string;
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

    constructor(uuid: string, config: BambooConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);

        const { serverUrl, plan, credentials } = config;
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
            + "max-results=1";

        console.log(uuid, "fetching " + chalk.green(planPart))

        fetch(url)
            .then(r => r.text())
            .then(s => {
                const res = BambooResponseDecoder.decodeString(s);
                switch (res.tag) {
                    case "Ok": {
                        // console.log(uuid, "decoded to", res.value);
                        const { buildState, lifeCycleState, buildResultKey } = res.value;
                        // TODO what if not finished ?? for now we just do nothing...
                        if (lifeCycleState === "Finished") {
                            const url = config.serverUrl + "/browse/" + buildResultKey;
                            if (buildState === "Successful") {
                                onResult(green(url));
                            } else {
                                onResult(red(url));
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
                console.error(e);
                onResult(error(e.message));
            });
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

