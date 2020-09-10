import {Msg} from "./Msg";
import {Dispatcher, Maybe, str} from "react-tea-cup";
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
            return <span>green</span>;
        }
        case "red": {
            return <span>red</span>;
        }
        case "none": {
            return <span>none</span>;
        }
    }
}

export function ViewBuildInfo(props: ViewBuildInfoProps) {
    const { dispatch, buildInfo } = props;
    const { info, status } = buildInfo;
    const buildUrl = getBuildUrl(status);
    switch (info.tag) {
        case "bamboo": {
            const text = info.plan + " (Bamboo)"
            return buildUrl
                .map(url => (
                  <a href={url}>{text}</a>
                ))
                .withDefault(<span>{text}</span>);
        }
        case "travis": {
            const text = `Repo : ${info.repository}, branch ${info.branch} (Travis)`;
            return buildUrl
                .map(url => (
                    <a href={url}>{text}</a>
                ))
                .withDefault(<span>{text}</span>);
        }
    }
}

