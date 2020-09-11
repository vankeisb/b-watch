import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common";
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Flags, init, Model, Msg, subscriptions, update, view} from "bwatch-common-front";
import * as electron from "electron";

import "bwatch-common-front/bwatch.css";

const ipc = electron.ipcRenderer;

const api: Api = new RemoteApi("http://localhost:4000/api");
const ws: WebSocket = new WebSocket("ws://localhost:4000");

const flags: Flags = {
    tag: "electron",
    ipcSend: ipc.send
};

ReactDOM.render(
    <Program
        init={() => init(api)}
        view={(dispatch, model) => view(flags, dispatch, model)}
        update={(msg, model) => update(flags, api, msg, model)}
        subscriptions={() => subscriptions(ws)}
        devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />,
    document.getElementById('root')
);
