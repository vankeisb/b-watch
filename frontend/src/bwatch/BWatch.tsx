import { noCmd, Cmd, Sub, Program, withReduxDevTools, DevTools } from "react-tea-cup";
import { Model } from "./model/Model";
import { Msg } from "./Msg";
import React from "react";

function init(): [Model, Cmd<Msg>] {
    return noCmd({
        foo: 132
    });
}

function view() {
    return (
        <div>Gnii</div>
    )
}

function update(msg: Msg, model: Model) : [Model, Cmd<Msg>] {
    return noCmd(model);
}


function subscriptions(model: Model): Sub<Msg> {
    return Sub.none();
}


export function BWatch() {
    return (
        <Program
            init={init}
            view={view}
            update={update}
            subscriptions={subscriptions}
            devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
        />
    )
}