import {Api, ListResponse} from "bwatch-common";
import {Build, CIClient} from "./CIClient";
import {Task} from "tea-cup-core";
import {BuildInfo} from "bwatch-common/dist/BuildInfo";

export class LocalApi implements Api {

    constructor(private readonly ciClient: CIClient) {
    }

    list(): Task<string, ListResponse> {
        return Task.fromLambda(() => {
            const builds = this.ciClient.list().map(toBuildInfo);
            const listResponse: ListResponse = {
                tag: "list-response",
                builds
            };
            return listResponse;
        }).mapError(e => e.message);
    }

}

export function toBuildInfo(build: Build): BuildInfo {
    const { config, uuid, status } = build;
    switch (config.tag) {
        case "travis": {
            return {
                tag: "build-info",
                uuid,
                status,
                info: {
                    tag: "travis",
                    branch: config.conf.branch,
                    repository: config.conf.repository,
                },
                groups: config.groups
            }
        }
        case "bamboo": {
            return {
                tag: "build-info",
                uuid,
                status,
                info: {
                    tag: "bamboo",
                    plan: config.conf.plan,
                },
                groups: config.groups
            }
        }
    }
}
