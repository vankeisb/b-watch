import React from 'react';
import './App.css';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Model, init, view, update, subscriptions, Msg, Flags } from "bwatch-common-front";
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common";
import {connectToWs} from "bwatch-common-front/dist/bwatch/BWatch";

const flags: Flags = {
  tag: "browser",
  daemonPort: 4000
};

connectToWs(flags);

export const App = () => {
  return (
    <Program
      init={() => init(flags)}
      view={(dispatch, model) => view(flags, dispatch, model)}
      update={(msg, model) => update(flags, msg, model)}
      subscriptions={() => subscriptions(flags)}
      devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />
  );
}

export default App;
