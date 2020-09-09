import * as uuid from "uuid";

export interface Config {}

export interface BambooConfig extends Config {
    readonly serverUrl: string;
    readonly plan: string;
}

export interface TravisConfig extends Config {
    readonly serverUrl: string;
    readonly repository: string;
    readonly branch: string;
    readonly travisToken?: string;
}

export type BuildConfig
    = { tag: "bamboo", conf: BambooConfig }
    | { tag: "travis", conf: TravisConfig };


export class CIClient {

    private readonly builds: Build[];

    constructor(configs: ReadonlyArray<BuildConfig>) {
        this.builds = configs.map(c => new Build(c))
        console.log("Initialized with " + this.builds.length + " build(s)")
    }

    list(): ReadonlyArray<Build> {
        return this.builds;
    }

}

export class Build {

    readonly uuid: string;
    private _status: BuildStatus;
    private _fetch?: Fetch<Config>;
    private _polling: boolean;
    private _pollTimeout: any;
    private _fetchCount: number;

    constructor(private readonly _config: BuildConfig) {
        this.uuid = uuid.v4();
        this._status = "none";
        this._polling = false;
        this._fetchCount = 0;
    }

    get config(): BuildConfig {
        return this._config;
    }

    get status(): BuildStatus {
        return this._status;
    }

    fetch(): void {
        this._fetchCount++;
        const fetchCount = this._fetchCount;
        console.log(this.uuid, "fetching")
        if (this._fetch) {
            console.log(this.uuid, "canceling previous fetch")
            this._fetch.cancel();
        }
        this._fetch = this.doFetch(status => {
            console.log(this.uuid, "got fetch status", status);
            if (fetchCount !== this._fetchCount) {
                console.warn(this.uuid, "fetch count dont match", this._fetchCount, fetchCount);
                return;
            }
            // TODO notify observers
            this._status = status;
            if (this._polling) {
                console.log(this.uuid, "polling, will fetch again")
                this._pollTimeout = setTimeout(() => {
                    if (this._polling) {
                        this.fetch();
                    }
                }, 5000); // TODO config timeout
            }
        });
    }

    start(): void {
        console.log(this.uuid, "start")
        this._polling = true;
        this.fetch();
    }

    stop(): void {
        console.log(this.uuid, "stop")
        this._polling = false;
        if (this._fetch) {
            this._fetch.cancel();
            delete this._fetch;
        }
        if (this._pollTimeout) {
            clearTimeout(this._pollTimeout);
            delete this._pollTimeout;
        }
    }

    protected doFetch(onResult: (status: BuildStatus) => void): Fetch<Config> {
        switch (this._config.tag) {
            case "bamboo": {
                return new BambooFetch(this.uuid, this._config.conf, onResult);
            }
            case "travis": {
                return new TravisFetch(this.uuid, this._config.conf, onResult);
            }
        }
    }
}


export abstract class Fetch<C extends Config> {

    constructor(
        private uuid: string,
        private readonly config: C,
        private readonly onResult: (status: BuildStatus) => void) {
    }

    abstract cancel(): void;

}


export type BuildStatus = "none" | "passed" | "failed" | "error"

class BambooFetch extends Fetch<BambooConfig> {

    constructor(uuid: string, config: BambooConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
        console.log(uuid, "bamboo fetch")
        setTimeout(() => {
            console.log(uuid, "got fake result");
            onResult(new Date().getTime() % 2 ? "passed" : "failed");
        }, 5000)
    }

    cancel(): void {

    }
}

class TravisFetch extends Fetch<TravisConfig> {
    cancel(): void {
    }
    constructor(uuid: string, config: TravisConfig, onResult: (status: BuildStatus) => void) {
        super(uuid, config, onResult);
    }






}
