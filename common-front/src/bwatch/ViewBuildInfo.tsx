import {Msg} from "./Msg";
import {Dispatcher, Maybe, maybeOf, nothing} from "tea-cup-core";
import {BuildInfo, BuildStatus, getBuildUrl, TimeInfo} from "bwatch-common";
import * as React from "react";
import {linkToBuild} from "./LinkToBuild";
import {Flags} from "./Flags";

const humanizeDuration = require("humanize-duration");

export interface ViewBuildInfoProps {
    dispatch: Dispatcher<Msg>
    buildInfo: BuildInfo;
    flags: Flags;
}

export function ViewStatus(props: { status: BuildStatus }) {
    const {status} = props;
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

const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: "shortEn",
    languages: {
        shortEn: {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
        },
    },
    delimiter: ' ',
    spacer: '',
    largest: 2
});

export function ViewTime(props: { timeInfo: TimeInfo }) {
    return <>
        <span className="badge badge-age">{shortEnglishHumanizer(calcAgeMillis(props.timeInfo))} ago</span>
        <span className="badge badge-duration">{shortEnglishHumanizer(props.timeInfo.durationSecs * 1000)}</span>
    </>
}

function calcAgeMillis(timeInfo: TimeInfo): number {
    return Date.parse(timeInfo.completedAt) - Date.now()
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
        case "circleci": {
            title = info.org + "/" + info.repo;
            subtitle = info.branch;
            url = getBuildUrl(props.buildInfo.status);
        }
    }
    const groupItems = props.buildInfo.groups.map(group => (
        <span key={group} className="badge badge-pill badge-primary">{group}</span>
    ));
    const groups = props.buildInfo.groups.length > 0
        ? (
            <h6 className="card-subtitle mb-2 text-muted">
                {groupItems}
            </h6>
        )
        : undefined;

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">
                    <div className={`icon ${info.tag}`}/>
                    <div className={"title"}>{title}</div>

                </h5>
                {subtitle &&
                    <h6 className="card-subtitle mb-2 text-muted">{subtitle}</h6>
                }
                {groups}
                <div className="spacer"/>
                <div className="status">
                    <ViewStatus status={props.buildInfo.status}/>
                    {
                        linkToBuild({
                            dispatch: props.dispatch,
                            flags: props.flags,
                            status: props.buildInfo.status,
                            text: "View result"
                        }).toNative()
                    }
                </div>
                {mapTimeInfo(props.buildInfo.status, timeInfo => (<div className="time">
                    <ViewTime timeInfo={timeInfo}/>
                </div>)).withDefault(<></>)}
            </div>
        </div>
    )
}

function mapTimeInfo<T>(status: BuildStatus, f: (timeInfo: TimeInfo) => T): Maybe<T> {
    switch (status.tag) {
        case "green":
            return maybeOf(status.timeInfo).map(f);
        case "red":
            return maybeOf(status.timeInfo).map(f);
        default:
            return nothing;
    }
}

