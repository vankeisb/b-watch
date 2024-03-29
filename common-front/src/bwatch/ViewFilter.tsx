import * as React from "react";
import {Msg} from "./Msg";
import {Dispatcher} from "tea-cup-core";
import {Model} from "./Model";

export interface ViewFilterProps {
    dispatch: Dispatcher<Msg>;
    model: Model;
}


export function ViewFilter(props: ViewFilterProps) {
    const { model, dispatch } = props;
    const { tab } = model;
    if (tab.tag === "builds" || tab.tag === "groups") {
        const { filter } = tab;
        return filter
            .map(f =>
                <div className="search input-group mb-3">
                    <input id="filter"
                           type="text"
                           className="form-control"
                           placeholder="Filter..."
                           aria-label="Filter"
                           aria-describedby="basic-addon1"
                           value={filter.withDefault('')}
                           autoComplete="off"
                           onChange={e =>
                               dispatch({ tag: "filter-changed", filter: e.target.value })
                           }
                    />
                    <div className="input-group-append">
                        <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => dispatch({tag: "close-filter"})}
                            id="button-addon2">
                            ×
                        </button>
                    </div>
                </div>
            )
            .withDefault(<></>);
    }
    return <></>;
}
