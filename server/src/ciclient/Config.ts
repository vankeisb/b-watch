export interface Config {

}

export interface BambooConfig extends Config {
    readonly serverUrl: string;
    readonly plan: string;
}

export interface TravisConfig extends Config {
    readonly serverUrl: string;
    readonly repository: string;
    readonly branch: string;
    readonly githubToken: string;
}
