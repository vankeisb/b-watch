import {Msg} from "./Msg";
import {Dispatcher, Maybe, nothing} from "react-tea-cup";
import {BuildInfo, BuildStatus, getBuildUrl} from "bwatch-common";
import * as React from "react";

export interface ViewBuildInfoProps {
    dispatch: Dispatcher<Msg>
    buildInfo: BuildInfo;
}

export function ViewStatus(props: {status: BuildStatus}) {
    const { status } = props;
    switch (status.tag) {
        case "error": {
            return <span>Error : {status.err}</span>
        }
        case "green": {
            return <span className="badge badge-success">PASSING</span>;
        }
        case "red": {
            return <span className="badge badge-danger">FAILED</span>;
        }
        case "none": {
            return <>
                <span className="badge badge-secondary">ERROR</span>
                <span>check the logs !</span>
            </>;
        }
    }
}

export function ViewBuildInfo(props: ViewBuildInfoProps) {

    let title;
    let subtitle;
    let url: Maybe<string> = nothing;
    const info = props.buildInfo.info;
    switch (info.tag) {
        case "travis": {
            title = info.repository;
            subtitle = info.branch;
            url = getBuildUrl(props.buildInfo.status);
            break;
        }
        case "bamboo": {
            title = info.plan;
            break;
        }
    }
    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">{title}</h5>
                {subtitle &&
                <h6 className="card-subtitle mb-2 text-muted">{subtitle}</h6>
                }
                <div className="spacer"/>
                <div className="status">
                    <ViewStatus status={props.buildInfo.status}/>
                    {url
                        .map(u =>
                            <a href={u} className="card-link">View result</a>
                        )
                        .withDefault(<></>)
                    }
                </div>
            </div>
        </div>
    )
}

