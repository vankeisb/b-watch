import React from 'react';
import './App.css';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Model, Msg, init, view, update, subscriptions } from "./bwatch/BWatch";

export const App = () => {
  return (
    <Program
      init={init}
      view={view}
      update={update}
      subscriptions={subscriptions}
      devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />
  );
}

export default App;
