import {Sub} from "tea-cup-core";

export function docOn<M, K extends keyof DocumentEventMap>(type: K,
                                                     toMsg: (ev: DocumentEventMap[K]) => M,
                                                     options?: boolean | AddEventListenerOptions): Sub<M> {
    return new DocSub(type, toMsg, options);
}


class DocSub<M, K extends keyof DocumentEventMap> extends Sub<M> {

    private readonly listener: (this: Document, ev: DocumentEventMap[K]) => any = ev => {
        this.dispatch(this.toMsg(ev))
    }

    constructor(
        private readonly type: K,
        private readonly toMsg: (ev: DocumentEventMap[K]) => M,
        private readonly options?: boolean | AddEventListenerOptions,
    ) {
        super();
    }

    protected onInit() {
        super.onInit();
        document.addEventListener(this.type, this.listener, this.options);
    }

    protected onRelease() {
        super.onRelease();
        document.removeEventListener(this.type, this.listener);
    }
}
