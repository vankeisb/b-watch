import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Flags, init, Model, Msg, subscriptions, update, view} from "bwatch-common-front";
import * as electron from "electron";
import "bwatch-common-front/bwatch.css";
import {Args} from "bwatch-daemon";

export interface ElectronArgs extends Args {
    remoteHost?: string;
}

const ipcRenderer = electron.ipcRenderer;

ipcRenderer.on("get-args", (ev, args) => {
    console.log("get-args", args);
    const a: ElectronArgs = args as ElectronArgs;
    const flags: Flags = {
        tag: "electron",
        ipc: {
            send(channel: string, ...args: any[]): void {
                ipcRenderer.send(channel, args);
            },
            on(channel: string, f:(...args: any[]) => void): void {
                ipcRenderer.on(channel, (event, arg) => {
                    console.log("ipcRenderer.on", channel, arg);
                    f(arg);
                });
            }
        },
        daemonPort: a.port,
        remoteHost: a.remoteHost
    };

    ReactDOM.render(
        <Program
            init={() => init(flags)}
            view={(dispatch, model) => view(flags, dispatch, model)}
            update={(msg, model) => update(flags, msg, model)}
            subscriptions={() => subscriptions(flags)}
            devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
        />,
        document.getElementById('root')
    );
})

// tell renderer that we're ready
ipcRenderer.send("renderer-ready", true);

// const args: Args = parseArgs({
//     name: "bwatch",
//     description: "bwatch desktop app",
//     version: "0.0.1",
// });

