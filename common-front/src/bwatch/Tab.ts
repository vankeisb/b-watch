import {Group} from "./Group";
import {Maybe, nothing} from "react-tea-cup";

export type Tab
    = { tag: "builds" }
    | { tag: "groups", selectedGroup: Maybe<Group> };


export type TabType = Tab["tag"]


export function initialTab(tabType: TabType): Tab {
    switch (tabType) {
        case "builds": {
            return { tag: "builds"}
        }
        case "groups": {
            return { tag: "groups", selectedGroup: nothing}
        }

    }
}
