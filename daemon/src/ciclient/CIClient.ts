import * as uuid from "uuid";
import {Fetch} from "./Fetch";
import {TravisConfig, TravisConfigDecoder, TravisFetch} from "./Travis";
import {BambooConfig, BambooConfigDecoder, BambooFetch} from "./Bamboo";
import {BuildStatus} from "bwatch-common";
import {Config} from "./Config";
import {Decoder} from "tea-cup-core";
import {Decode as D} from "tea-cup-core/dist/Decode";
import chalk from "chalk";


export type BuildConfig
    = BambooBuildConfig
    | TravisBuildConfig

export interface BambooBuildConfig {
    tag: "bamboo"
    conf: BambooConfig
}

export const BambooBuildConfigDecoder: Decoder<BambooBuildConfig> =
    D.map(
        conf => ({tag: "bamboo", conf}),
        BambooConfigDecoder
    );

export const TravisBuildConfigDecoder: Decoder<TravisBuildConfig> =
    D.map(
        conf => ({tag: "travis", conf}),
        TravisConfigDecoder
    );


export const BuildConfigDecoder: Decoder<BuildConfig> =
    D.andThen(
        tag => {
            switch (tag) {
                case "bamboo":
                    return BambooBuildConfigDecoder;
                case "travis":
                    return TravisBuildConfigDecoder;
                default:
                    return D.fail("unhandled tag " + tag);
            }
        },
        D.field("tag", D.str)
    );

export interface TravisBuildConfig {
    tag: "travis"
    conf: TravisConfig
}

export class CIClient {

    private readonly builds: Build[];

    constructor(configs: ReadonlyArray<BuildConfig>,
                private readonly listener: (build: Build) => void) {
        this.builds = configs.map(c => new Build(c, listener))
        console.log("Initialized with", chalk.green(this.builds.length) + " build configuration(s)")
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

    constructor(private readonly _config: BuildConfig,
                private readonly listener: (build: Build) => void) {
        this.uuid = uuid.v4();
        this._status = {tag: "none"};
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
            this._status = status;
            this.listener(this);
            delete this._fetch;
            if (this._polling) {
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

