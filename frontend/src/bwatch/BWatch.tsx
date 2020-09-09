import {
    Cmd,
    Decode as D,
    Decoder,
    Dispatcher,
    Http,
    just,
    Maybe,
    noCmd,
    nothing,
    Result,
    Sub,
    Task
} from "react-tea-cup";
import React from "react";
import {Msg} from "./Msg";
import {ListResponse, ListResponseDecoder} from "bwatch-common";
import {ViewBuildInfo, ViewStatus} from "./ViewBuildInfo";

export interface Model {
    readonly builds: Maybe<Result<string,ListResponse>>;
}

function gotBuilds(r: Result<string,ListResponse>): Msg {
    return {
        tag: "got-builds",
        r
    }
}

export function init(): [Model, Cmd<Msg>] {
    const model: Model = {
        builds: nothing
    };
    const listBuilds: Task<string,ListResponse> =
        Http.jsonBody(
            Http.fetch('/api'),
            ListResponseDecoder
        ).mapError(e => e.message);
    return [ model, Task.attempt(listBuilds, gotBuilds) ];
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return model.builds
        .map(respRes =>
            respRes.match(
                listResponse => (
                    <>
                        {listResponse.builds.map(build => (
                            <div>
                                <ViewStatus status={build.status} />
                                <ViewBuildInfo key={build.uuid} dispatch={dispatch} buildInfo={build}/>
                            </div>
                        ))}
                    </>
                ),
                err => {
                    return (
                        <p>Error : {err}</p>
                    )
                }
            )
        )
        .withDefaultSupply(() => (
            <p>Loading...</p>
        ));
}

export function update(msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    console.log("update", msg);
    switch (msg.tag) {
        case "got-builds": {
            return noCmd({
                ...model,
                builds: just(msg.r)
            })
        }
    }
    return noCmd(model);
}


export function subscriptions(model: Model): Sub<Msg> {
    return Sub.none();
}
