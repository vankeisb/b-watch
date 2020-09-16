import {Cmd, Dispatcher, just, Maybe, nothing, ok, Result, Sub, Task, Tuple} from "react-tea-cup";
import * as React from "react";
import {gotBuilds, gotWsMessage, Msg} from "./Msg";
import {Api, BuildInfo, BuildInfoDecoder, ListResponse, RemoteApi} from "bwatch-common";
import {ViewBuildInfo} from "./ViewBuildInfo";
import {ViewGroups} from "./ViewGroups";
import {initialTab, Tab, TabType} from "./Tab";
import {Flags, Ipc} from "./Flags";
import {linkToBuild} from "./LinkToBuild";
import {computeGroup} from "./Group";
import {ViewSettings} from "./ViewSettings";
import {defaultSettings, loadSettingsFromLocalStorage, saveSettingsToLocalStorage, Settings} from "./Settings";
import {displayTheme, Theme} from "./ThemeConfig";
import {fromLambdaSuccess} from "./TaskSuccessfulFromLambda";
import {ViewFilter} from "./ViewFilter";
import {docOn} from "./DocumentSubs";

if (Notification.permission !== "granted")
    Notification.requestPermission();

let ws: WebSocket | undefined;

export function connectToWs(flags: Flags) {
    const url = `ws://${getHost(flags)}:${flags.daemonPort}`;
    console.log("connecting to ws", url);
    ws = new WebSocket(url);
    ws.addEventListener("open", () => {
        console.log("websocket opened", url);
    });
    ws.addEventListener("close", () => {
        console.log("websocket closed", url);
    });
    ws.addEventListener("error", ev => {
        console.error("websocket error", ev);
    })
}

export interface Model {
    readonly listResponse: Maybe<Result<string,ListResponse>>;
    readonly tab: Tab;
    readonly settings: Maybe<Settings>;
}

const defaultHost = "localhost";

export function getHost(flags: Flags): string {
    return flags.tag === "electron"
        ? (flags.remoteHost || defaultHost)
        : defaultHost
}

export function remoteApi(flags: Flags): RemoteApi {
    return new RemoteApi(`http://${getHost(flags)}:${flags.daemonPort}/api`);
}

export function init(flags: Flags): [Model, Cmd<Msg>] {
    const model: Model = {
        listResponse: nothing,
        tab: { tag: "builds", filter: nothing },
        settings: nothing,
    };
    const loadSettings: Cmd<Msg> = Task.perform(
        loadSettingsFromLocalStorage(),
        settings => ({ tag: "got-settings", settings })
    )
    switch (flags.tag) {
        case "browser": {
            return Tuple.fromNative(listBuilds(remoteApi(flags), model))
                .mapSecond(c => Cmd.batch([c, loadSettings]))
                .toNative();
        }
        case "electron": {
            console.log("app ready");
            const notifyAppReady = Task.fromLambda(() => {
                flags.ipc.send("app-ready", true);
            })
            return Tuple.t2n(
                model,
                Cmd.batch([
                    Task.attempt(notifyAppReady, () => ({tag: "noop"})),
                    loadSettings
                ])
            )
        }
    }
}

function viewTabs(dispatch: Dispatcher<Msg>, model: Model) {

    function navLinkClass(tab: TabType) {
        return "nav-link" + (
            model.tab.tag === tab
                ? " active"
                : ""
        );
    }

    function navItem(tab: TabType) {
        return (
            <li className="nav-item" key={tab}>
                <a className={navLinkClass(tab)}
                    href="#"
                    onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        dispatch({
                            tag: "tab-clicked",
                            tab
                        })
                    }}
                >
                    {tab}
                </a>
            </li>
        )
    }

    return (
        <ul className="nav nav-tabs">
            {navItem("builds")}
            {navItem("groups")}
            {navItem("settings")}
        </ul>
    )
}


function viewTabContent(flags: Flags, dispatch: Dispatcher<Msg>, model: Model) {
    const filter = model.tab.tag === "builds" || model.tab.tag === "groups"
        ? model.tab.filter
        : nothing;



    function buildMatches(buildInfo: BuildInfo): boolean {
        return filter
            .map(f => {

                function strMatches(str: string): boolean {
                    return str.toLowerCase().indexOf(f.toLowerCase()) !== -1;
                }

                const { info } = buildInfo;
                switch (info.tag) {
                    case "travis": {
                        return strMatches(info.repository)
                            || strMatches(info.branch);
                    }
                    case "bamboo": {
                        return strMatches(info.plan);
                    }
                }
            })
            .withDefault(true)
    }

    return model.listResponse
        .map(r =>
            r.match(
                listResponse => {
                    switch (model.tab.tag) {
                        case "builds":
                            return (
                                <div className="scroll-pane">
                                    <div className="builds">
                                        {listResponse.builds
                                            .filter(buildMatches)
                                            .map(build => (
                                            <ViewBuildInfo
                                                key={build.uuid}
                                                dispatch={dispatch}
                                                buildInfo={build}
                                                flags={flags}/>
                                        ))}
                                    </div>
                                </div>
                            );
                        case "groups": {
                            return (
                                <ViewGroups dispatch={dispatch} listResponse={listResponse}/>
                            )
                        }
                        case "settings": {
                            return (
                                <ViewSettings dispatch={dispatch} settings={model.settings}/>
                            )
                        }
                    }
                },
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
        ))}

export function view(flags: Flags, dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <>
            {viewModal(flags, dispatch, model)}
            <div className="bwatch">
                {viewTabs(dispatch, model)}
                <div className="content">
                    <ViewFilter dispatch={dispatch} model={model} />
                    {viewTabContent(flags, dispatch, model)}
                </div>
            </div>
            { model.tab.tag === "groups" && model.tab.selectedGroup.isJust()
                ? <div className="modal-backdrop show"></div>
                : <></>
            }
        </>
    )
}

function viewModal(flags: Flags, dispatch: Dispatcher<Msg>, model: Model) {
    return model.listResponse
        .map(listResponse => {
            if (model.tab.tag === "groups") {
                return model.tab.selectedGroup
                    .map(selectedGroup => {
                        const group = computeGroup(selectedGroup, listResponse.map(lr => lr.builds).withDefault([]))
                        return (
                            <div className="modal" tabIndex={-1}>
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">{group.name}</h5>
                                            <button type="button" className="close" aria-label="Close"
                                                    onClick={() => dispatch({tag: "close-group"})}>
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">
                                            <h6><span className="badge badge-primary">TOTAL</span></h6>
                                            <p>
                                                {group.total} build(s)
                                            </p>
                                            {group.nbOk > 0
                                                ? (
                                                    <>
                                                        <h6>
                                                            <span className="badge badge-success">PASSING</span>
                                                        </h6>
                                                        <ul>
                                                            {group.builds
                                                                .filter(b => b.status.tag === "green")
                                                                .map(b => getGroupBuildLink(flags, dispatch, b))
                                                            }
                                                        </ul>
                                                    </>
                                                )
                                                : <></>
                                            }
                                            {group.nbKo > 0
                                                ? (
                                                    <>
                                                        <h6>
                                                            <span className="badge badge-danger">FAILED</span>
                                                        </h6>
                                                        <ul>
                                                            {group.builds
                                                                .filter(b => b.status.tag === "red")
                                                                .map(b => getGroupBuildLink(flags, dispatch, b))
                                                            }
                                                        </ul>
                                                    </>
                                                )
                                                : <></>
                                            }
                                            {group.nbErr > 0
                                                ? (
                                                    <>
                                                        <h6>
                                                            <span className="badge badge-warning">ERROR</span>
                                                        </h6>
                                                        <ul>
                                                            {group.builds
                                                                .filter(b => b.status.tag === "error")
                                                                .map(b => getGroupBuildLink(flags, dispatch, b))
                                                            }
                                                        </ul>
                                                    </>
                                                )
                                                : <></>
                                            }
                                            {group.nbNone > 0
                                                ? (
                                                    <>
                                                        <h6>
                                                            <span className="badge badge-secondary">LOADING</span>
                                                        </h6>
                                                        <ul>
                                                            {group.builds
                                                                .filter(b => b.status.tag === "none")
                                                                .map(b => getGroupBuildLink(flags, dispatch, b))
                                                            }
                                                        </ul>
                                                    </>
                                                )
                                                : <></>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                    .withDefault(<></>);
            }
            return <></>;
        })
        .withDefault(<></>);
}

function getGroupBuildLink(flags: Flags, dispatch: Dispatcher<Msg>, build: BuildInfo) {
    let text: string;
    switch (build.info.tag) {
        case "bamboo": {
            text = build.info.plan;
            break;
        }
        case "travis": {
            text = build.info.repository + "/" + build.info.branch;
            break;
        }
    }
    return (
        <li key={text}>
            {linkToBuild({
                flags,
                dispatch,
                status: build.status,
                text
            }).withDefault(<span>{text}</span>)}
        </li>
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
                    let needsNotif = model.settings.map(s => s.notificationsEnabled).withDefault(true)
                    if (index === -1) {
                        needsNotif = needsNotif && true;
                        newBuilds = builds.concat([build]);
                    }  else {
                        const prevBuild = builds[index];
                        newBuilds[index] = build;
                        needsNotif = needsNotif && prevBuild.status.tag !== "none" && prevBuild.status.tag !== build.status.tag;
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
                        notifCmd = taskToCmdNoop(
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
                                        flags.ipc.send("open-build", url);
                                        break;
                                    }
                                }
                            })
                        );
                    }

                    return Tuple.t2n(newModel, notifCmd)
                },
                err => {
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

function listBuilds(api: Api, model: Model): [Model, Cmd<Msg>] {
    return [{...model, listResponse: nothing }, Task.attempt(api.list(), gotBuilds)];
}

export function update(flags: Flags, msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    // console.log("update", msg);
    switch (msg.tag) {
        case "noop":
            return noCmd(model);
        case "reload":
            return listBuilds(remoteApi(flags), model);
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
            break;
        }
        case "server-ready": {
            const connectCmd: Cmd<Msg> = Task.attempt(
                Task.fromLambda(() => {
                    connectToWs(flags);
                    return true;
                }),
                () => ({tag: "noop"})
            );

            return Tuple.fromNative(listBuilds(remoteApi(flags), model))
                .mapSecond(c => Cmd.batch([connectCmd, c]))
                .toNative()
        }
        case "tab-clicked": {
            return noCmd(
                {
                    ...model,
                    tab: initialTab(msg.tab)
                }
            );
        }
        case "open-group": {
            if (model.tab.tag === "groups") {
                return noCmd({
                    ...model,
                    tab: {
                        ...model.tab,
                        selectedGroup: just(msg.group.name)
                    }
                });
            }
            return noCmd(model);
        }
        case "close-group":
            return noCmd({
                ...model,
                tab: initialTab("groups")
            });
        case "got-settings": {
            return Tuple.t2n(
                {
                    ...model,
                    settings: just(msg.settings)
                },
                displayThemeCmd(msg.settings.theme)
            );
        }
        case "toggle-notifications-enabled": {
            const settings = model.settings
                .map(s => ({
                    ...s,
                    notificationsEnabled: !s.notificationsEnabled
                }))
                .withDefault(defaultSettings);
            return Tuple.t2n(
                {
                    ...model,
                    settings: just(settings)
                },
                taskToCmdNoop(saveSettingsToLocalStorage(settings))
            )
        }
        case "toggle-dark-mode": {
            if (model.settings.type === "Nothing") {
                return noCmd(model);
            }
            const settings: Settings = model.settings.value;
            const theme: Theme = settings.theme === "dark" ? "light" : "dark";

            return Tuple.t2n(
                {
                    ...model,
                    settings: just({...settings, theme})
                },
                Cmd.batch([
                    taskToCmdNoop(saveSettingsToLocalStorage(settings)),
                    displayThemeCmd(theme)
                ])
            )
        }
        case "filter-changed": {
            if (model.tab.tag === "settings") {
                return noCmd(model)
            }
            return noCmd({
                ...model,
                tab: {
                    ...model.tab,
                    filter: just(msg.filter)
                }
            })
        }
        case "open-filter": {
            const { tab } = model;
            if (tab.tag === "builds" || tab.tag === "groups") {
                return Tuple.t2n(
                    {
                        ...model,
                        tab: {
                            ...tab,
                            filter: just("")
                        }
                    },
                    taskToCmdNoop(
                        Task.fromLambda(() => {
                            document.getElementById("filter")?.focus()
                        })
                    )
                )
            }
            return noCmd(model)
        }
        case "close-filter": {
            const { tab } = model;
            if (tab.tag === "builds" || tab.tag === "groups") {
                return noCmd({
                    ...model,
                    tab: {
                        ...tab,
                        filter: nothing
                    }
                })
            }
            return noCmd(model)
        }
    }
}

function displayThemeCmd(theme: Theme): Cmd<Msg> {
    return taskToCmdNoop(
        fromLambdaSuccess(() => {
            displayTheme(theme);
        })
    );
}

function taskToCmdNoop(task: Task<any,any>): Cmd<Msg> {
    return Task.attempt(
        task,
        () => ({ tag: "noop"})
    )
}

function openBuild(flags: Flags, url: string): Cmd<Msg> {
    switch (flags.tag) {
        case "electron": {
            return Task.attempt(
                Task.fromLambda(() => {
                    flags.ipc.send("open-build", url);
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

export function subscriptions(flags: Flags): Sub<Msg> {
    let ipc: Sub<Msg> = Sub.none();
    if (flags.tag === "electron") {
        ipc = ipcSub<Msg>(flags.ipc, "server-ready", msgArgs => {
            debugger;
            return {
                tag: "server-ready",
                args: msgArgs
            }
        });
    }
    let wsSub: Sub<Msg> = Sub.none();
    if (ws) {
        wsSub = onWebSocketMessage(ws, gotWsMessage);
    }
    const onDocKey: Sub<Msg> = docOn("keydown", ev => {
        if (ev.code === "KeyF" && ev.ctrlKey) {
            ev.preventDefault();
            return {
                tag: "open-filter"
            } as Msg
        }
        if (ev.code === "Escape") {
            return {
                tag: "close-filter"
            }
        }

        return { tag: "noop" }
    })
    return Sub.batch([wsSub, ipc, onDocKey]);
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
        // console.log("wsEvt", ev.data);
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
        const n = new Notification(this.title, this.options);
        n.onclick = e => {
            this.onClick(e)
        };
        callback(ok(n));
    }
}

// ipc helper

type IpcListener = (args: any[]) => void;

let ipcListeners: { [id: string]: IpcListener } = {};
let ipcSubs: IpcSub<any>[] = [];

function ipcSub<M>(ipc: Ipc, channel: string, toMsg: (args: any) => M): Sub<M> {
    return new IpcSub(ipc, channel, toMsg);
}

class IpcSub<M> extends Sub<M> {

    constructor(
        readonly ipc: Ipc,
        readonly channel: string,
        private readonly toMsg: (args: any) => M
    ) {
        super();
    }

    protected onInit() {
        super.onInit();
        ipcSubs.push(this);
        if (ipcListeners[this.channel] === undefined) {
            const l = (args: any[]) => {
                ipcSubs
                    .filter(s => s.channel === this.channel)
                    .forEach(s => {
                        s.onIpcMessage(args)
                    });
            }
            ipcListeners[this.channel] = l;
            this.ipc.on(this.channel, l);
        }
    }

    protected onRelease() {
        super.onRelease();
        ipcSubs = ipcSubs.filter(s => s !== this);
    }

    onIpcMessage(args: any[]) {
        this.dispatch(this.toMsg(args));
    }
}

