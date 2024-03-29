import { ListResponse } from "bwatch-common";
import * as React from "react";
import {Msg} from "./Msg";
import { Dispatcher, Maybe } from "tea-cup-core";
import {computeGroups, Group} from "./Group";

export interface ViewGroupsProps {
    dispatch: Dispatcher<Msg>;
    listResponse: ListResponse;
    filter: Maybe<string>;
}

export function ViewGroups(props: ViewGroupsProps) {
    const { listResponse, filter, dispatch } = props;

    function linkToGroup(group: Group) {
        return (
            <a href="#" onClick={e => {
                e.preventDefault();
                props.dispatch({ tag: "open-group", group });
            }}>
                View details
            </a>
        );
    }


    function groupMatches(group: Group): boolean {
        return filter
            .map(f => {
                function strMatches(str: string): boolean {
                    return str.toLowerCase().indexOf(f.toLowerCase()) !== -1;
                }

                return strMatches(group.name)
            })
            .withDefault(true)
    }

    return (
        <div className="scroll-pane">
            <div className="groups">
                {computeGroups(listResponse.builds)
                    .filter(groupMatches)
                    .map(group =>
                        <div className="card" key={group.name}>
                            <div className="card-body">
                                <h5 className="card-title">{group.name}</h5>
                                <div className="status">
                                    {viewCountForStatuses(group)}
                                    {linkToGroup(group)}
                                </div>
                            </div>
                        </div>
                    )}
            </div>
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


