import {Fetch} from "./Fetch";
import {BuildStatus, error, green, red, TimeInfo} from "bwatch-common";
import fetch from "node-fetch"
import {Decode as D, Decoder} from "tea-cup-core";


function apiUrl(serverUrl: string) {
    console.log("serverUrl", serverUrl);
    if (serverUrl === "https://travis-ci.org") {
        return "https://api.travis-ci.org";
    }
    return serverUrl + "/api";
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
        .then(r => {
            if (r.status !== 200) {
                throw new Error(`HTTP status ${r.status}`)
            }
            return r;
        })
        .then(r => r.json())
        .then(obj => {
            const {last_build} = obj;
            if (last_build) {
                let state = last_build.state;
                let buildId = last_build.id;
                let url = config.serverUrl + "/" + config.repository + "/builds/" + buildId;
                // accumulated duration of all build stages:
                // const durationSecs = last_build.duration
                const durationSecs = (Date.parse(last_build.finished_at) - Date.parse(last_build.started_at)) / 1000
                const timeInfo: TimeInfo = {completedAt: last_build.finished_at, durationSecs};
                if (state === "started" || state === "created") {
                    state = last_build.previous_state;
                    console.log("using previous state", state);
                }
                console.log("state", "'" + state + "'");
                if (state === "passed") {
                    return green(url, timeInfo);
                } else if (state === "failed" || state === "errored") {
                    return red(url, timeInfo);
                }
                console.error(uuid, "unhandled build state", obj);
                return error("unhandled state " + state);
            } else {
                const error_message = obj.error_message;
                if (error_message) {
                    return error(error_message);
                }
            }
            console.error(uuid, "unable to parse", obj);
            return error("unable to parse response");
        })
        .catch(e => {
            return error(e.message);
        });
}

export interface TravisConfig {
    readonly serverUrl: string;
    readonly repository: string;
    readonly branch: string;
    readonly token?: string;
}

export class TravisFetch extends Fetch<TravisConfig> {

    private _canceled: boolean = false;

    constructor(uuid: string, config: TravisConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
        getBuildStatus(uuid, config.token, config)
            .then(value => {
                if (!this._canceled) {
                    onResult(value)
                }
            })
    }

    cancel(): void {
        this._canceled = true;
    }
}

export const TravisConfigDecoder: Decoder<TravisConfig> =
    D.map4(
        (serverUrl, repository, branch, token) => ({serverUrl, repository, branch, token}),
        D.field("serverUrl", D.str),
        D.field("repository", D.str),
        D.field("branch", D.str),
        D.oneOf([
            D.field("token", D.str),
            D.succeed(undefined)
        ])
    );


