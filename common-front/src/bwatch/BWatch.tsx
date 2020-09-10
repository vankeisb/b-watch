import {Cmd, Dispatcher, just, Maybe, nothing, Result, Sub, Task, ok, Tuple} from "react-tea-cup";
import React from "react";
import {gotBuilds, gotWsMessage, Msg} from "./Msg";
import {Api, BuildInfo, BuildInfoDecoder, ListResponse} from "bwatch-common";
import {ViewBuildInfo, ViewStatus} from "./ViewBuildInfo";

export interface Model {
    readonly listResponse: Maybe<Result<string,ListResponse>>;
}

export function init(api: Api): [Model, Cmd<Msg>] {
    const model: Model = {
        listResponse: nothing
    };
    return [ model, Task.attempt(api.list(), gotBuilds) ];
}

function viewPage(content: React.ReactNode) {
    return (
        <div className="bwatch">
            <h1>b-watch</h1>
            <div className="content">
                <div className="scroll-pane">
                    {content}
                </div>
            </div>
        </div>
    )
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {

    return viewPage(
        model.listResponse
            .map(respRes =>
                respRes.match(
                    listResponse => (
                        <div className="builds">
                            {listResponse.builds.map(build => (
                                <ViewBuildInfo key={build.uuid} dispatch={dispatch} buildInfo={build}/>
                            ))}
                        </div>
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
            ))
    );
}

function noCmd(model: Model): [Model,Cmd<Msg>] {
    return [model, Cmd.none()];
}


function updateBuild(model: Model, build: BuildInfo): [Model, Cmd<Msg>] {
    return model.listResponse
        .map(r =>
            r.match(
                listResp => {
                    const { builds } = listResp;
                    const index = builds.findIndex(b => b.uuid === build.uuid);
                    let newBuilds = [...builds];
                    if (index === -1) {
                        newBuilds = builds.concat([build]);
                    }  else {
                        newBuilds[index] = build;
                    }
                    const newResp: ListResponse = {
                        ...listResp,
                        builds: newBuilds
                    }
                    const newModel: Model = {
                        ...model,
                        listResponse: just(ok(newResp))
                    };
                    return Tuple.t2n(newModel, Cmd.none<Msg>())
                },
                err => {
                    console.warn("trying to update build whereas we have an error", err);
                    return noCmd(model);
                }
            )
        )
        .withDefaultSupply(() => noCmd(model));
}

export function update(msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    // console.log("update", msg);
    switch (msg.tag) {
        case "got-builds":
            return noCmd({
                ...model,
                listResponse: just(msg.r)
            })
        case "got-ws-message": {
            const data: any = msg.data;
            const decoded: Result<string,BuildInfo> =
                typeof data === "string"
                    ? BuildInfoDecoder.decodeString(data)
                    : BuildInfoDecoder.decodeValue(data)
            console.log("decoded", decoded)
            switch (decoded.tag) {
                case "Ok": {
                    return updateBuild(model, decoded.value);
                }
                case "Err": {
                    console.error("unable to decode message data", decoded.err);
                    return noCmd(model);
                }
            }
        }
    }
}

export function subscriptions(ws: WebSocket): Sub<Msg> {
    return onWebSocketMessage(ws, gotWsMessage);
}

// WS helper

let socketSubs: WebSocketSub<any>[] = [];

function onWebSocketMessage<M>(ws: WebSocket, toMsg: (data:any) => M): Sub<M> {
    return new WebSocketSub(ws, toMsg);
}

class WebSocketSub<M> extends Sub<M> {

    constructor(
        private readonly ws: WebSocket,
        private readonly toMsg: (data:any) => M
    ) {
        super();
    }

    protected onInit() {
        socketSubs.push(this);
        this.ws.addEventListener("message", this.listener);
    }

    private readonly listener = (ev: MessageEvent) => {
        this.dispatch(this.toMsg(ev.data));
    }

    protected onRelease() {
        super.onRelease();
        this.ws.removeEventListener("message", this.listener);
    }
}
