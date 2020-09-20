import {Decode as D, Decoder, Task} from "react-tea-cup"
import {fromLambdaSuccess} from "./TaskSuccessfulFromLambda";
import {detectTheme, Theme} from "./ThemeConfig";

export interface Settings {
    readonly notificationsEnabled: boolean;
    readonly theme: Theme;
}

export const defaultSettings: Settings = {
    notificationsEnabled: true,
    theme: "light"
}

export const localStorageKey = "bwatch-settings";

const SettingsDecoder: Decoder<Settings> =
    D.map2(
        (notificationsEnabled: boolean, theme: Theme) => ({notificationsEnabled, theme}),
        D.field("notificationsEnabled", D.bool),
        D.andThen(
            s => {
                if (s === "dark" || s === "light") {
                    return D.succeed(s as Theme);
                }
                return D.fail(`invalid theme ${s}`)
            },
            D.field("theme", D.str)
        )
    );

export function loadSettingsFromLocalStorage(): Task<never, Settings>{
    return fromLambdaSuccess(() => {
        const s = window.localStorage.getItem(localStorageKey);
        if (s) {
            const r = SettingsDecoder.decodeString(s);
            switch (r.tag) {
                case "Err": {
                    console.warn("unable to load settings, creating new settings", r.err);
                    // remove corrupt version
                    window.localStorage.removeItem(localStorageKey);
                    const theme: Theme = detectTheme();
                    return {
                        ...defaultSettings,
                        theme: theme
                    }
                }
                case "Ok": {
                    console.log("loaded settings", r.value);
                    return r.value;
                }
            }
        }
        console.warn("no settings found in local storage, using default settings")
        return defaultSettings;
    });
}

export function saveSettingsToLocalStorage(settings: Settings): Task<never, Settings> {
    return fromLambdaSuccess(() => {
        console.log("saving settings", settings);
        window.localStorage.setItem(localStorageKey, JSON.stringify(settings));
        return settings;
    })
}
