import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common";
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {init, Model, Msg, subscriptions, update, view} from "bwatch-common-front";

import "bwatch-common-front/bwatch.css";


const api: Api = new RemoteApi("http://localhost:4000/api");
const ws: WebSocket = new WebSocket("ws://localhost:4000");

ReactDOM.render(
    <Program
        init={() => init(api)}
        view={view}
        update={(msg, model) => update(api, msg, model)}
        subscriptions={() => subscriptions(ws)}
        devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />,
    document.getElementById('root')
);
