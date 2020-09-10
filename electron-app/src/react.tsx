import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Sub} from "react-tea-cup";

ReactDOM.render(
    <div>yalla</div>,
    // <Program
    //     init={init}
    //     view={view}
    //     update={update}
    //     subscriptions={subscriptions}
    //     devTools={withReduxDevTools(DevTools.init<Model, Msg>(window))}
    // />,
    document.getElementById('app')
);

class CISub<M> extends Sub<M> {



}
