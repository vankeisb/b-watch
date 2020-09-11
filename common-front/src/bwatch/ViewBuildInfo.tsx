import {Msg} from "./Msg";
import {Dispatcher, Maybe, nothing} from "react-tea-cup";
import {BuildInfo, BuildStatus, getBuildUrl} from "bwatch-common";
import * as React from "react";
import {Flags} from "./BWatch";

export interface ViewBuildInfoProps {
    dispatch: Dispatcher<Msg>
    buildInfo: BuildInfo;
    flags: Flags;
}

export function ViewStatus(props: {status: BuildStatus}) {
    const { status } = props;
    switch (status.tag) {
        case "error": {
            return <>
                <span className="badge badge-warning">
                    ERROR
                </span>
                <span className="error-text" title={status.err}>
                    {status.err}
                </span>
            </>;
        }
        case "green": {
            return <span className="badge badge-success">PASSING</span>;
        }
        case "red": {
            return <span className="badge badge-danger">FAILED</span>;
        }
        case "none": {
            return <span className="badge badge-secondary">LOADING...</span>;
        }
    }
}

export function ViewBuildInfo(props: ViewBuildInfoProps) {

    function linkToBuild(url: string) {
        switch (props.flags.tag) {
            case "browser": {
                return <a href={url} className="card-link">View result</a>;
            }
            case "electron":
                return (
                    <a href="#" onClick={e => {
                        e.preventDefault();
                        props.dispatch({ tag: "open-build", url });
                    }}>
                        View result
                    </a>
                );
        }
    }

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
                        .map(u => linkToBuild(u))
                        .toNative()
                    }
                </div>
            </div>
        </div>
    )
}

