import React from 'react';
import './App.css';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Model, init, view, update, subscriptions, Msg } from "bwatch-common-front";
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common";

const api: Api = new RemoteApi("/api");
const ws: WebSocket = new WebSocket("ws://localhost:4000");

export const App = () => {
  return (
    <Program
      init={() => init(api)}
      view={view}
      update={update}
      subscriptions={() => subscriptions(ws)}
      devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />
  );
}

export default App;
