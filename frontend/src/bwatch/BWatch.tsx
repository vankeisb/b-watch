import {Cmd, Decode as D, Decoder, Http, Maybe, noCmd, nothing, Result, Sub, Task, Dispatcher, just} from "react-tea-cup";
import React from "react";
import {BuildStatus, BuildStatusNone} from "bwatch-common";

export interface Model {
    readonly builds: Maybe<Result<string,ListBuildsResponse>>;
}

export interface Build {
    readonly uuid: string;
    readonly status: BuildStatus;
}


export type Msg
    = { tag: "got-builds"; r: Result<string,ListBuildsResponse> };


function gotBuilds(r: Result<string,ListBuildsResponse>): Msg {
    return {
        tag: "got-builds",
        r
    }
}

interface ListBuildsResponse {
    readonly builds: ReadonlyArray<Build>
}

const BuildStatusDecoder: Decoder<BuildStatus> =
    D.andThen(
        tag => {
            if (tag === "none") {
                return D.succeed(BuildStatusNone);
            }
            if (tag === "green" || tag === "red") {
                return D.map(
                    url => ({tag, url}),
                    D.field("url", D.str)
                );
            }
            if (tag === "error") {
                return D.map(
                    err => ({tag, err}),
                    D.field("err", D.str)
                )
            }
            return D.fail("no such tag " + tag);
        },
        D.field("tag", D.str)
    );


const BuildDecoder: Decoder<Build> =
    D.map2(
        (uuid, status) => ({uuid, status}),
        D.field("uuid", D.str),
        D.field("status", BuildStatusDecoder)
    );

const ListBuildsResponseDecoder: Decoder<ListBuildsResponse> =
    D.map(
        builds => ({builds}),
        D.field("builds", D.array(BuildDecoder))
    );


export function init(): [Model, Cmd<Msg>] {
    const model: Model = {
        builds: nothing
    };
    const listBuilds: Task<string,ListBuildsResponse> =
        Http.jsonBody(
            Http.fetch('/api'),
            ListBuildsResponseDecoder
        ).mapError(e => e.message);
    return [ model, Task.attempt(listBuilds, gotBuilds) ];
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return model.builds
        .map(respRes =>
            respRes.match(
                listBuildsResponse => (
                    <>
                        {listBuildsResponse.builds.map(build => (
                                <li key={build.uuid}>{build.uuid}</li>
                            )
                        )}
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
