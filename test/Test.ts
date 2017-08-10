import { Logger } from 'core';

/**
 * All tests should be inherited from this Test class
 */
export class Test {
    public run() : void {
        for (const key of Object.getOwnPropertyNames(
            Object.getPrototypeOf(this)
        )) {
            if (key.indexOf('test') === 0) {
                const cName: string = this.constructor.name.replace('Test', '');
                const logger: Logger = new Logger(cName);
                let name: string = key.substr(4);
                name = name[0].toLocaleLowerCase() + name.substr(1);
                // tslint:disable-next-line
                new Promise<any>((resolve, reject) => {
                    // tslint:disable-next-line
                    resolve((<Function>(<any>this)[key])());
                }).then(
                    () => logger.info(`${name}: \u2705`)
                ).catch((err: Error) : void => {
                    logger.error(`${name}: \u274C`, err);
                    process.exit(1);
                });
            }
        }
    }

    // tslint:disable-next-line
    protected assert(a: any, b: any) {
        if (a !== b) {
            throw new Error(`Assertion Error: ${a} !== ${b}`);
        }
    }
}
