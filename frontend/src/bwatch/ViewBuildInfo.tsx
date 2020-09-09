import {Msg} from "./Msg";
import {Dispatcher} from "react-tea-cup";
import {BuildInfo, BuildStatus} from "bwatch-common";
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
    const { info } = buildInfo;
    switch (info.tag) {
        case "bamboo": {
            return (
                <span>
                    {info.plan} (Bamboo)
                </span>
            )
        }
        case "travis": {
            return (
                <span>
                    Repo : {info.repository}, branch {info.branch} (Travis)
                </span>
            )
        }
    }

}
