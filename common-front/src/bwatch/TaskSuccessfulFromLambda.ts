// see https://github.com/vankeisb/react-tea-cup/issues/21

import {ok, Result, Task} from "tea-cup-core";

export function fromLambdaSuccess<T>(f:() => T): Task<never,T> {
    return new TaskSuccessfulFromLambda(f);
}

class TaskSuccessfulFromLambda<T> extends Task<never,T> {

    constructor(private readonly f:() => T) {
        super();
    }

    execute(callback: (r: Result<never, T>) => void): void {
        callback(ok(this.f()))
    }
}
