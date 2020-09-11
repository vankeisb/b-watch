import {BuildStatus} from "bwatch-common";

export abstract class Fetch<C> {

    constructor(
        private uuid: string,
        private readonly config: C,
        private readonly onResult: (status: BuildStatus) => void) {
    }

    abstract cancel(): void;

}
