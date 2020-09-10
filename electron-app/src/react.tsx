import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Model, init, view, update, subscriptions, Msg } from "bwatch-common-front";
import {DevTools, Program, withReduxDevTools} from "react-tea-cup";

ReactDOM.render(
    <Program
        init={init}
        view={view}
        update={update}
        subscriptions={subscriptions}
        devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    />,
    document.getElementById('app')
);
