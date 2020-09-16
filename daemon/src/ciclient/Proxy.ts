import chalk from "chalk";

const proxy = process.env.http_proxy || process.env.HTTP_PROXY;
if (proxy) {
    console.log(chalk.yellow("using proxy"), chalk.green(proxy));
}
//
// export function withProxy(url: string) {
//     const r = superagent
//         .get(url);
//     if (proxy) {
//         r.proxy(proxy);
//     }
//     return r;
// }
