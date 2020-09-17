import * as React from "react";
import {Msg} from "./Msg";
import {Dispatcher, Maybe, nothing} from "react-tea-cup";
import {Settings} from "./Settings";
import {UpdateStatus} from "./Model";

export interface ViewSettingsProps {
    dispatch: Dispatcher<Msg>;
    settings: Maybe<Settings>;
    updateStatus: Maybe<UpdateStatus>;
    version: string;
}

function ViewUpdate(props: ViewSettingsProps) {
    return props.updateStatus
        .map(updateStatus => {
            switch (updateStatus.tag) {
                case "started":
                    return (
                        <div className="alert alert-info" role="alert">
                            <h4 className="alert-heading">New version available</h4>
                            <p>
                                Version {updateStatus.newVersion} is downloading...
                            </p>
                        </div>
                    )
                case "downloaded":
                    return (
                        <div className="alert alert-info" role="alert">
                            <h4 className="alert-heading">Ready to update</h4>
                            <p>
                                Update downloaded, will be installed on next restart.
                            </p>
                            <button className="btn btn-info" onClick={() => props.dispatch({ tag: "update-install" })}>
                                Restart now
                            </button>
                        </div>
                    )
            }

        })
        .withDefault(<></>)
}

export function ViewSettings(props: ViewSettingsProps) {
    return (
        <div className="settings">
            {props.settings
                .map(settings => {
                    const {notificationsEnabled, theme} = settings;
                    return (
                        <>
                            <ViewUpdate {...props} />
                            <form>
                                <div className="form-group">
                                    Version {props.version}
                                </div>
                                <div className="form-group form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="enableNotifications"
                                        checked={notificationsEnabled}
                                        onChange={() => props.dispatch({tag: "toggle-notifications-enabled"})}/>
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
                                        onChange={() => props.dispatch({tag: "toggle-dark-mode"})}/>
                                    <label className="form-check-label" htmlFor="darkMode">
                                        Dark mode
                                    </label>
                                </div>
                            </form>
                        </>
                    )
                })
                .withDefault(<p>Loading...</p>)
            }
        </div>
    )
}
