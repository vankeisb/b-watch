import {BuildInfo} from "bwatch-common";
import {Maybe} from "react-tea-cup";

export class Group {

    readonly nbOk: number;
    readonly nbKo: number;
    readonly nbNone: number;
    readonly nbErr: number;
    readonly total: number;

    constructor(
        readonly name: string,
        readonly builds: readonly BuildInfo[]) {
        let nbOk = 0, nbKo = 0, nbNone = 0, nbErr = 0;
        this.total = builds.length;
        builds.forEach(build => {
            switch (build.status.tag) {
                case "red": {
                    nbKo++;
                    break;
                }
                case "green": {
                    nbOk++;
                    break;
                }
                case "none": {
                    nbNone++;
                    break;
                }
                case "error": {
                    nbErr++;
                    break;
                }
            }
        });
        this.nbOk = nbOk;
        this.nbKo = nbKo;
        this.nbNone = nbNone;
        this.nbErr = nbErr;
    }
}

export function computeGroups(builds: readonly BuildInfo[]): Group[] {
    const res: { [id: string]: BuildInfo[] } = {};
    builds.forEach(build =>
        build.groups.forEach(groupName => {
            let groupBuilds: BuildInfo[] = res[groupName];
            if (groupBuilds === undefined) {
                groupBuilds = [];
                res[groupName] = groupBuilds;
            }
            groupBuilds.push(build)
        })
    );
    return Object.keys(res).map(name => new Group(name, res[name]));
}

export function computeGroup(name: string, builds: readonly BuildInfo[]): Group {
    return new Group(
        name,
        builds.filter(b => b.groups.find(g => g === name) !== undefined)
    )
}
