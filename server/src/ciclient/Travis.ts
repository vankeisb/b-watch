import {Config} from "./Config";
import {Fetch} from "./Fetch";
import {BuildStatus, BuildStatusNone, error, green, red} from "./BuildStatus";
import fetch from "node-fetch"
import {Decoder, Err, Decode as D, Result} from "tea-cup-core";


function getAccessToken(uuid: string, serverUrl: string, githubToken: string): Promise<string> {
    const url = serverUrl + '/api/auth/github';
    console.log(uuid, "authenticating")
    return fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({github_token: githubToken})
    })
        .then(r => r.json())
        .then(obj => {
            const accessToken = obj.access_token;
            if (!accessToken) {
                return error(new Error("No access token"));
            }
            console.log(uuid, "access token obtained", accessToken)
            return accessToken;
        });
}

function getBuildStatus(uuid: string, accessToken: string, config: TravisConfig): Promise<BuildStatus> {
    const encodedRepo = encodeURIComponent(config.repository);
    const encodedBranch = encodeURIComponent(config.branch);
    const url = config.serverUrl +
        "/api/repo/" +
        encodedRepo +
        "/branch/" +
        encodedBranch;
    console.log(uuid, "fetching build status", url);
    return fetch(url, {
            headers:{
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Travis-API-Version': '3',
                'Authorization': 'token ' + accessToken
            },
        }
    )
        .then(r => r.json())
        .then(obj => {
            const { last_build } = obj;
            // console.log("obj", obj);
            if (last_build) {
                let state = last_build.state;
                let buildId = last_build.id;
                let url = config.serverUrl + "/" + config.repository + "/builds/" + buildId;
                if (state === "started") {
                    state = state.previous_state;
                }
                if (state === "passed") {
                    return green(url);
                } else if (state === "failed") {
                    return red(url);
                }
                console.error(uuid, "unhandled build state", obj);
                return error(new Error("unhanlded state " + state));
            }
            console.error(uuid, "unable to parse", obj);
            return error(new Error("last build not found"));
        });
}

export interface TravisConfig extends Config {
    readonly serverUrl: string;
    readonly repository: string;
    readonly branch: string;
    readonly githubToken: string;
}

export class TravisFetch extends Fetch<TravisConfig> {

    private _canceled: boolean = false;

    constructor(uuid: string, config: TravisConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
        getAccessToken(uuid, config.serverUrl, config.githubToken)
            .then(token => {
                getBuildStatus(uuid, token, config)
                    .then(onResult)
                    .catch(e =>
                        onResult(error(e))
                    )
            })
            .catch(e =>
                onResult(error(e))
            )
    }

    cancel(): void {
        this._canceled = true;
    }
}

