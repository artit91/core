import * as fs from 'fs';

/**
 * Gets the config from the root.
 */
function getConfig() : {} {
    return JSON.parse(
        fs.readFileSync(
            'config/config.json'
        ).toString()
    );
}

/**
 * IConfig interface
 */
interface IConfig {
    [s: string]: IConfig | {} | void;
}

/**
 * Get config once per `require()`.
 * Subject to change.
 */
const cfg: IConfig = getConfig();

/**
 * Gets the path from the config file.
 * @param path Path in config object e.g. `'services.mongodb.uris'`
 */
export function config(path: string) : IConfig | {} | void {
    const parts: string[] = path.split('.');
    let root: IConfig | void = cfg;

    while (parts.length && root) {
        const first: string = <string>parts.shift();
        root = root[first];
    }

    return root;
}
