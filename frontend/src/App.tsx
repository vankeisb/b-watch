import React from 'react';
import './App.css';
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";
import {Model, init, view, update, subscriptions, Msg } from "bwatch-common-front";
import {Api} from "bwatch-common";
import {RemoteApi} from "bwatch-common/dist/RemoteApi";

const api: Api = new RemoteApi();

export const App = () => {
  return (
    <Program
      init={() => init(api)}
      view={view}
      update={update}
      subscriptions={subscriptions}
      devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />
  );
}

export default App;
