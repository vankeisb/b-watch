import {Cmd, Dispatcher, just, Maybe, nothing, ok, Result, Sub, Task, Tuple} from "react-tea-cup";
import React from "react";
import {gotBuilds, gotWsMessage, Msg} from "./Msg";
import {Api, BuildInfo, BuildInfoDecoder, ListResponse} from "bwatch-common";
import {ViewBuildInfo} from "./ViewBuildInfo";

if (Notification.permission !== "granted")
    Notification.requestPermission();

export type IpcSend = (channel: string, args: any[]) => void;

export type Flags
    = { tag: "browser" }
    | { tag: "electron", ipcSend: IpcSend };

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
            <div className="content">
                <div className="scroll-pane">
                    {content}
                </div>
            </div>
        </div>
    )
}

export function view(flags: Flags, dispatch: Dispatcher<Msg>, model: Model) {

    return viewPage(
        model.listResponse
            .map(respRes =>
                respRes.match(
                    listResponse => (
                        <div className="builds">
                            {listResponse.builds.map(build => (
                                <ViewBuildInfo
                                    key={build.uuid}
                                    dispatch={dispatch}
                                    buildInfo={build}
                                    flags={flags}/>
                            ))}
                        </div>
                    ),
                    err => {
                        return (
                            <div className="error">
                                <div className="alert alert-danger">
                                    <strong>Error!</strong> {err}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => dispatch({ tag: "reload" })}>
                                    ↻ Reload
                                </button>
                            </div>
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


function updateBuild(flags: Flags, model: Model, build: BuildInfo): [Model, Cmd<Msg>] {
    return model.listResponse
        .map(r =>
            r.match(
                listResp => {
                    const { builds } = listResp;
                    const index = builds.findIndex(b => b.uuid === build.uuid);
                    let newBuilds = [...builds];
                    let needsNotif;
                    if (index === -1) {
                        needsNotif = true;
                        newBuilds = builds.concat([build]);
                    }  else {
                        const prevBuild = builds[index];
                        newBuilds[index] = build;
                        needsNotif = prevBuild.status.tag !== "none" && prevBuild.status.tag !== build.status.tag;
                    }
                    const newResp: ListResponse = {
                        ...listResp,
                        builds: newBuilds
                    }
                    const newModel: Model = {
                        ...model,
                        listResponse: just(ok(newResp))
                    };

                    let notifCmd: Cmd<Msg> = Cmd.none();

                    let url = "";
                    if (build.status.tag === "green" || build.status.tag === "red") {
                        url = build.status.url;
                    }

                    if (needsNotif) {
                        notifCmd = Task.perform(
                            notification(notifTitle(build), {
                                body: notifBody(build),
                            }, e => {
                                switch (flags.tag) {
                                    case "browser": {
                                        e.preventDefault();
                                        window.open(url, '_blank');
                                        break;
                                    }
                                    case "electron": {
                                        flags.ipcSend("open-build", [url]);
                                        break;
                                    }
                                }
                            }),
                            () => ({tag: "noop"})
                        );
                    }

                    return Tuple.t2n(newModel, notifCmd)
                },
                err => {
                    // TODO recreate the list with only one build ?
                    console.warn("trying to update build whereas we have an error", err);
                    return noCmd(model);
                }
            )
        )
        .withDefaultSupply(() => noCmd(model));
}

function notifBody(build: BuildInfo): string {
    switch (build.status.tag) {
        case "error":
            return "⚠ Error !";
        case "green":
            return "✓ passed";
        case "red":
            return "✖ failed";
        case "none":
            return "loading";
    }
}

function notifTitle(build: BuildInfo): string {
    const { info } = build;
    switch (info.tag) {
        case "bamboo": {
            return info.plan;
        }
        case "travis": {
            return info.repository + "/" + info.branch;
        }
    }
}

export function update(flags: Flags, api: Api, msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    // console.log("update", msg);
    switch (msg.tag) {
        case "noop":
            return noCmd(model);
        case "reload":
            return init(api);
        case "got-builds":
            return noCmd({
                ...model,
                listResponse: just(msg.r)
            })
        case "open-build": {
            switch (flags.tag) {
                case "electron": {
                    return Tuple.t2n(
                        model,
                        openBuild(flags, msg.url)
                    );
                }
                case "browser": {
                    return noCmd(model);
                }
            }
            break;
        }
        case "got-ws-message": {
            const data: any = msg.data;
            const decoded: Result<string,BuildInfo> =
                typeof data === "string"
                    ? BuildInfoDecoder.decodeString(data)
                    : BuildInfoDecoder.decodeValue(data)
            switch (decoded.tag) {
                case "Ok": {
                    return updateBuild(flags, model, decoded.value);
                }
                case "Err": {
                    console.error("unable to decode message data", decoded.err);
                    return noCmd(model);
                }
            }
        }
    }
}

function openBuild(flags: Flags, url: string): Cmd<Msg> {
    switch (flags.tag) {
        case "electron": {
            return Task.attempt(
                Task.fromLambda(() => {
                    flags.ipcSend("open-build", [url]);
                    return true;
                }),
                () => ({tag: "noop"})
            )
        }
        case "browser": {
            return Cmd.none();
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

// notifications helper

function notification(title: string, options: NotificationOptions, onClick: (e:Event) => void): Task<never, Notification> {
    return new NotifTask(title, options, onClick);
}

class NotifTask extends Task<never, Notification> {

    constructor(private readonly title: string,
                private readonly options: NotificationOptions,
                private readonly onClick: (e:Event) => void) {
        super();
    }

    execute(callback: (r: Result<never, Notification>) => void): void {
        debugger;
        const n = new Notification(this.title, this.options);
        n.onclick = e => {
            this.onClick(e)
        };
        callback(ok(n));
    }
}

