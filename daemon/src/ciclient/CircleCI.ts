import {Decoder, err} from "tea-cup-core";
import {Decode as D} from "tea-cup-core";
import {Fetch} from "./Fetch";
import {BuildStatus, error, green, red} from "bwatch-common";
import {pipe} from "superagent";
import fetch from "node-fetch";

export interface CircleCIConfig {
    readonly org: string;
    readonly repo: string;
    readonly branch: string;
    readonly token?: string;
}

export const CircleCIConfigDecoder: Decoder<CircleCIConfig> =
    D.mapObject({
        ...D.mapRequiredFields({
            org: D.str,
            repo: D.str,
            branch: D.str
        }),
        ...D.mapOptionalFields({
            token: D.str
        })
    });

export class CircleCIFetch extends Fetch<CircleCIConfig> {

    private _canceled: boolean = false;

    constructor(uuid: string, config: CircleCIConfig, onResult: (status: BuildStatus) => void) {
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

const baseUrl = "https://circleci.com/api/v2";

export function getBuildStatus(uuid: string, accessToken: string | undefined, config: CircleCIConfig): Promise<BuildStatus> {
    const encodedOrg = encodeURIComponent(config.org);
    const encodedRepo = encodeURIComponent(config.repo);
    const encodedBranch = encodeURIComponent(config.branch);
    const pipelineUrl = baseUrl + "/project/github/" +
        encodedOrg + "/" + encodedRepo +
        "/pipeline?branch=" + encodedBranch;
    const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (accessToken) {
        headers['Circle-Token'] = accessToken;
    }
    return fetch(pipelineUrl, {headers})
        .then(pipelineResponse => {
            if (pipelineResponse.status !== 200) {
                throw new Error(`HTTP status ${pipelineResponse.status}`)
            }
            return pipelineResponse;
        })
        .then(r => r.json())
        .then(pipelineRespObj => {
            const items = pipelineRespObj.items;
            if (Array.isArray(items) && items.length > 0) {
                const item0 = items[0];
                const pipelineId = item0.id;
                if (typeof pipelineId !== 'string') {
                    return error("ID not readable");
                }
                // now that we have the pipeline's ID, get workflow
                const workflowUrl = baseUrl +
                    "/pipeline/" + pipelineId + "/workflow"
                return fetch(workflowUrl, {headers})
                    .then(workflowResponse => {
                        if (workflowResponse.status !== 200) {
                            throw new Error(`HTTP status ${workflowResponse.status}`)
                        }
                        return workflowResponse;
                    })
                    .then(r => r.json())
                    .then(workflowRespObj => {
                        const workflowItems = workflowRespObj.items;
                        if (Array.isArray(workflowItems) && workflowItems.length > 0) {
                            const wfItem0 = workflowItems[0];
                            const status = wfItem0.status;

                            const getAppUrl = () => {
                                const pipelineNumber = wfItem0.pipeline_number;
                                const wfId = wfItem0.id;
                                return "https://app.circleci.com/pipelines/github/" +
                                    encodedOrg + "/" + encodedRepo + "/" +
                                    pipelineNumber + "/workflows/" + wfId;
                            }

                            switch (status) {
                                case "success":
                                    return green(getAppUrl());
                                case "failed":
                                case "failing":
                                    return red(getAppUrl());
                                case "error":
                                    return error("build error");
                                default:
                                    return error("unhandled status " + status);
                            }
                        } else {
                            return error("no items in workflow resp");
                        }
                    });
            } else {
                return error("no items found in pipeline");
            }
        })
        .catch(e =>
            error(e.message)
        );
}
