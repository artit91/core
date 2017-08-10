import 'reflect-metadata';

import { Exception } from 'core';
import { IContext } from 'core';
import { IEvent } from 'core';
import { IResource } from 'core';
import { IService } from 'core';

import { requirementMetadataKey } from 'core/require';
import { resourcesMetadataKey } from 'core/resource';

const overiddenMetadataKey: Symbol = Symbol('overridden');

function decorateService(
    target: {},
    propertyKey: string
) : void {
    const overridden: boolean = Reflect.getOwnMetadata(
        overiddenMetadataKey,
        target,
        propertyKey
    );

    if (overridden) {
        return;
    }

    // tslint:disable-next-line
    let fn: IService<{}> | void = (<any>target)[propertyKey];

    const overrideFn: IService<{}> = async(
        event: IEvent = {},
        context: IContext = {}
    ) : Promise<{} | void> => {
        // @Require
        const requireKeys: string[] = Reflect.getOwnMetadata(
            requirementMetadataKey,
            target,
            propertyKey
        ) || [];

        for (const param of Object.keys(event)) {
            const val: string = event[param];

            if (typeof val !== 'string') {
                throw new Exception(
                    -1,
                    'parameter_is_not_a_string',
                    { paramName: param }
                );
            }
        }

        for (const param of requireKeys) {
            const val: string = event[param];

            if (val === undefined) {
                throw new Exception(
                    -1,
                    'parameter_required',
                    { paramName: param }
                );
            }
        }

        // @Resource
        const resources: {[s: string]: IResource} = {};
        const resourceKeys: string[] = Reflect.getOwnMetadata(
            resourcesMetadataKey,
            target,
            propertyKey
        ) || [];

        for (const param of resourceKeys) {
            try {
                // tslint:disable-next-line
                resources[param] = require(`src/resource/${param}`)[param];
            } catch (e) {
                // ignore
            }
        }

        const destroy: Function = (): Promise<void[]> => Promise.all(
            Object.keys(resources).map(
                (resKey: string) => resources[resKey].destroy(
                    <{}>context[resKey]
                )
            )
        );

        let result: {} | void;
        try {
            if (!fn) {
                throw new Exception(
                    -1,
                    'reflection_error',
                    {
                        decorator: 'Resource',
                        propertyKey
                    }
                );
            }
            // create resources
            await Promise.all(
                Object.keys(resources).map(
                    (resKey: string) => resources[resKey].create().then(
                        (res: {}) => (context[resKey] = res)
                    ).catch(
                        (error: {}) => Promise.reject(new Exception(
                            -1,
                            'resource_not_found',
                            {
                                decorator: 'Resource',
                                resource: resKey
                            }
                        ))
                    )
                )
            );
            // run decorated function
            result = await fn(event, context);
            await destroy();
        } catch (error) {
            await destroy();
            throw error;
        }

        return result;
    };

    // tslint:disable-next-line
    (<any>target)[propertyKey] = overrideFn;

    Reflect.defineMetadata(
        overiddenMetadataKey,
        true,
        target,
        propertyKey
    );
}

/**
 * @Service decorator for services.
 * @Resource and @Require won't work without this.
 * Usage:
 * `
 *  @Service
 *  @Resource('mongo', 'now')
 *  export class Auth {
 *    @Require('email', 'password')
 *    public static register: IService<ISession> = async(event, context) => { }
 *  }
 * `
 */
export const Service = (target: {}): void => { // tslint:disable-line
    for (const protoPropertyKey of Object.getOwnPropertyNames(target)) {
        // tslint:disable-next-line
        if (typeof (<any>target)[protoPropertyKey] !== 'function' ||
            protoPropertyKey === 'constructor') {
            continue;
        }
        decorateService(target, protoPropertyKey);
    }
};
