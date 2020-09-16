import * as React from "react";
import {Msg} from "./Msg";
import { Dispatcher, Maybe } from "react-tea-cup";
import { Settings } from "./Settings";

export interface ViewSettingsProps {
    dispatch: Dispatcher<Msg>;
    settings: Maybe<Settings>;
}

export function ViewSettings(props: ViewSettingsProps) {
    return (
        <div className="settings">
            {props.settings
                .map(settings => {
                    const { notificationsEnabled, theme } = settings;
                    return (
                        <form>
                            <div className="form-group form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="enableNotifications"
                                    checked={notificationsEnabled}
                                    onChange={() => props.dispatch({ tag: "toggle-notifications-enabled"})}/>
                                <label className="form-check-label" htmlFor="enableNotifications">
                                    Enable notifications
                                </label>
                            </div>
                            <div className="form-group form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="darkMode"
                                    checked={theme === "dark"}
                                    onChange={() => props.dispatch({ tag: "toggle-dark-mode" })}/>
                                <label className="form-check-label" htmlFor="darkMode">
                                    Dark mode
                                </label>
                            </div>
                        </form>
                    )
                })
                .withDefault(<p>Loading...</p>)
            }
        </div>
    )
}
