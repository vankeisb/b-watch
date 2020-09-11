import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common";
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Flags, init, Model, Msg, subscriptions, update, view} from "bwatch-common-front";
import * as electron from "electron";

import "bwatch-common-front/bwatch.css";

const ipcRenderer = electron.ipcRenderer;

const api: Api = new RemoteApi("http://localhost:4000/api");
const ws: WebSocket = new WebSocket("ws://localhost:4000");

const flags: Flags = {
    tag: "electron",
    ipc: {
        send(channel: string, ...args: any[]): void {
            ipcRenderer.send(channel, args);
        },
        on(channel: string, f:(...args: any[]) => void): void {
            ipcRenderer.on(channel, (event, args) => {
                f(args);
            });
        }
    }
};

ReactDOM.render(
    <Program
        init={() => init(flags, api)}
        view={(dispatch, model) => view(flags, dispatch, model)}
        update={(msg, model) => update(flags, api, msg, model)}
        subscriptions={() => subscriptions(flags, ws)}
        devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />,
    document.getElementById('root')
);
