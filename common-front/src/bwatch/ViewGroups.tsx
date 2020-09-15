import { BuildInfo, ListResponse } from "bwatch-common";
import * as React from "react";

export interface ViewGroupsProps {
    listResponse: ListResponse;
}

export function ViewGroups(props: ViewGroupsProps) {
    const { listResponse } = props;
    return (
        <div className="groups">
            {computeGroups(listResponse.builds).map(group =>
                <div className="card" key={group.name}>
                    <div className="card-body">
                        <h5 className="card-title">{group.name}</h5>
                        <div className="status">
                            {viewCountForStatuses(group)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function viewCountForStatuses(group: Group) {
    return (
        <>
            {
                group.nbOk > 0
                    ? <span className="badge badge-success">{group.nbOk}</span>
                    : <></>
            }
            {
                group.nbKo > 0
                    ? <span className="badge badge-danger">{group.nbKo}</span>
                    : <></>
            }
            {
                group.nbErr > 0
                    ? <span className="badge badge-warning">{group.nbErr}</span>
                    : <></>
            }
            {
                group.nbNone > 0
                    ? <span className="badge badge-secondary">{group.nbNone}</span>
                    : <></>
            }
            <span className="badge badge-primary">{group.total}</span>
        </>
    )
}

class Group {

    readonly nbOk: number;
    readonly nbKo: number;
    readonly nbNone: number;
    readonly nbErr: number;
    readonly total: number;

    constructor(
        readonly name: string,
        readonly builds: readonly BuildInfo[]) {
        let nbOk = 0, nbKo = 0, nbNone = 0, nbErr = 0;
        this.total = builds.length;
        builds.forEach(build => {
            switch (build.status.tag) {
                case "red": {
                    nbKo++;
                    break;
                }
                case "green": {
                    nbOk++;
                    break;
                }
                case "none": {
                    nbNone++;
                    break;
                }
                case "error": {
                    nbErr++;
                    break;
                }
            }
        });
        this.nbOk = nbOk;
        this.nbKo = nbKo;
        this.nbNone = nbNone;
        this.nbErr = nbErr;
    }
}

function computeGroups(builds: readonly BuildInfo[]): Group[] {
    const res: { [id: string]: BuildInfo[] } = {};
    builds.forEach(build =>
        build.groups.forEach(groupName => {
            let groupBuilds: BuildInfo[] = res[groupName];
            if (groupBuilds === undefined) {
                groupBuilds = [];
                res[groupName] = groupBuilds;
            }
            groupBuilds.push(build)
        })
    );
    return Object.keys(res).map(name => new Group(name, res[name]));
}
