import {Fetch} from "./Fetch";
import {BuildStatus, error, green, red} from "bwatch-common";
import fetch from "node-fetch"
import {Decoder} from "tea-cup-core";
import {Decode as D} from "tea-cup-core";


function apiUrl(serverUrl: string) {
    console.log("serverUrl", serverUrl);
    if (serverUrl === "https://travis-ci.org") {
        return "https://api.travis-ci.org";
    }
    return serverUrl + "/api";
}

function getAccessToken(uuid: string, serverUrl: string, githubToken: string): Promise<string> {
    const url = apiUrl(serverUrl) + '/auth/github';
    console.log(uuid, "authenticating", url)
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
                return error("No access token found in auth response");
            }
            console.log(uuid, "access token obtained", accessToken)
            return accessToken;
        });
}

function getBuildStatus(uuid: string, accessToken: string | undefined, config: TravisConfig): Promise<BuildStatus> {
    const encodedRepo = encodeURIComponent(config.repository);
    const encodedBranch = encodeURIComponent(config.branch);
    const url = apiUrl(config.serverUrl) + "/repo/" +
        encodedRepo +
        "/branch/" +
        encodedBranch;
    console.log(uuid, "fetching build status", url);
    const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Travis-API-Version': '3',
    };
    if (accessToken) {
        headers['Authorization'] = 'token ' + accessToken;
    }
    return fetch(url, {headers})
        .then(r => r.json())
        .then(obj => {
            const { last_build } = obj;
            // console.log("obj", obj);
            if (last_build) {
                let state = last_build.state;
                let buildId = last_build.id;
                let url = config.serverUrl + "/" + config.repository + "/builds/" + buildId;
                if (state === "started") {
                    state = last_build.previous_state;
                }
                if (state === "passed") {
                    return green(url);
                } else if (state === "failed") {
                    return red(url);
                }
                console.error(uuid, "unhandled build state", obj);
                return error("unhanlded state " + state);
            } else {
                const error_message = obj.error_message;
                if (error_message) {
                    return error(error_message);
                }
            }
            console.error(uuid, "unable to parse", obj);
            return error("unable to parse response");
        });
}

export interface TravisConfig {
    readonly serverUrl: string;
    readonly repository: string;
    readonly branch: string;
    readonly githubToken?: string;
}

export class TravisFetch extends Fetch<TravisConfig> {

    private _canceled: boolean = false;

    constructor(uuid: string, config: TravisConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
        // TODO fix when using travis token
        if (config.githubToken) {
            getAccessToken(uuid, config.serverUrl, config.githubToken)
                .then(token => {
                    getBuildStatus(uuid, token, config)
                        .then(onResult)
                })
                .catch(e => {
                    console.error(uuid, "auth error", e);
                    onResult(error("error while authenticating"));
                })
        } else {
            getBuildStatus(uuid, undefined, config)
                .then(onResult)
        }
    }

    cancel(): void {
        this._canceled = true;
    }
}

export const TravisConfigDecoder: Decoder<TravisConfig> =
    D.map4(
        (serverUrl, repository, branch, githubToken) => ({ serverUrl, repository, branch, githubToken }),
        D.field("serverUrl", D.str),
        D.field("repository", D.str),
        D.field("branch", D.str),
        D.oneOf([
            D.field("githubToken", D.str),
            D.succeed(undefined)
        ])
    );


