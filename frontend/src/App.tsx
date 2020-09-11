import React from 'react';
import './App.css';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Flags, init, Model, Msg, subscriptions, update, view} from "bwatch-common-front";
import {connectToWs} from "bwatch-common-front/dist/bwatch/BWatch";

const flags: Flags = {
  tag: "browser",
  daemonPort: 3000,
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
