import {Maybe, nothing} from "react-tea-cup";

export type Tab
    = { tag: "builds", readonly filter: Maybe<string> }
    | { tag: "groups", readonly filter: Maybe<string>, readonly selectedGroup: Maybe<string> }
    | { tag: "settings" };


export type TabType = Tab["tag"]


export function initialTab(tabType: TabType): Tab {
    switch (tabType) {
        case "builds": {
            return { tag: "builds", filter: nothing }
        }
        case "groups": {
            return { tag: "groups", selectedGroup: nothing, filter: nothing }
        }
        case "settings": {
            return { tag: "settings" }
        }
    }
}
