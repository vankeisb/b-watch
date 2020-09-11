import React from 'react';
import './App.css';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Model, init, view, update, subscriptions, Msg, Flags } from "bwatch-common-front";
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common";

const api: Api = new RemoteApi("/api");
const ws: WebSocket = new WebSocket("ws://localhost:4000");

const flags: Flags = {
  tag: "browser"
};

export const App = () => {
  return (
    <Program
      init={() => init(flags, api)}
      view={(dispatch, model) => view(flags, dispatch, model)}
      update={(msg, model) => update(flags, api, msg, model)}
      subscriptions={() => subscriptions(flags, ws)}
      devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />
  );
}

export default App;
