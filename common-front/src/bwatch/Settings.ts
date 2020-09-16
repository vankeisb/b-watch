import {Decode as D, Decoder, Task} from "react-tea-cup"
import {fromLambdaSuccess} from "./TaskSuccessfulFromLambda";

export interface Settings {
    readonly notificationsEnabled: boolean;
}

export const defaultSettings: Settings = {
    notificationsEnabled: true
}

export const localStorageKey = "bwatch-settings";

const SettingsDecoder: Decoder<Settings> =
    D.map(
        notificationsEnabled => ({notificationsEnabled}),
        D.field("notificationsEnabled", D.bool)
    );

export function loadSettingsFromLocalStorage(): Task<never, Settings>{
    return fromLambdaSuccess(() => {
        const s = window.localStorage.getItem(localStorageKey);
        if (s) {
            const r = SettingsDecoder.decodeString(s);
            switch (r.tag) {
                case "Err": {
                    console.warn("unable to load settings, creating new settings", r.err);
                    return defaultSettings;
                }
                case "Ok": {
                    return r.value;
                }
            }
        }
        return defaultSettings;
    });
}

export function saveSettingsToLocalStorage(settings: Settings): Task<never, Settings> {
    return fromLambdaSuccess(() => {
        window.localStorage.setItem(localStorageKey, JSON.stringify(settings));
        return settings;
    })
}
