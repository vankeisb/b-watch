import * as React from "react";
import {Flags} from "./Flags";
import {Msg} from "./Msg";
import {Dispatcher, Maybe} from "react-tea-cup";
import {BuildStatus, getBuildUrl} from "bwatch-common";

export interface LinkToBuildProps {
    status: BuildStatus;
    flags: Flags;
    dispatch: Dispatcher<Msg>;
    text: string;
}

export function linkToBuild(props: LinkToBuildProps): Maybe<React.ReactElement> {
    const { status, flags, dispatch, text } = props;
    return getBuildUrl(status)
        .map(url => {
            switch (flags.tag) {
                case "browser": {
                    return <a href={url} className="card-link">{text}</a>;
                }
                case "electron":
                    return (
                        <a href="#" onClick={e => {
                            e.preventDefault();
                            dispatch({tag: "open-build", url: url});
                        }}>
                            {text}
                        </a>
                    );
            }
        })
}
