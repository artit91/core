import 'reflect-metadata';

import { IContext } from 'core';
import { IEvent } from 'core';
import { IService } from 'core';

export const resourcesMetadataKey: string = 'resources';

function addMeta(
    target: {},
    propertyKey: string,
    params: string[]
) : void {
    const resources: string[] = Reflect.getOwnMetadata(
        resourcesMetadataKey,
        target,
        propertyKey
    ) || [];
    for (const param of params) {
        if (resources.indexOf(param) === -1) {
            resources.push(param);
        }
    }
    Reflect.defineMetadata(
        resourcesMetadataKey,
        resources,
        target,
        propertyKey
    );
}

/**
 * @Resource decorator for services
 * Usage:
 * `
 *  @Service
 *  @Resource('now', 'email')
 *  export class Auth {
 *    @Resource('mongo')
 *    public static register: IService<ISession> = async(event, context) => { }
 *  }
 * `
 */
export const Resource = (...params: string[]) : Function => ( // tslint:disable-line
    target: {},
    propertyKey?: string,
    propertyDescriptor?: TypedPropertyDescriptor<IService<{}>>
): void => {
    // @Resource on property
    if (propertyKey) {
        addMeta(target, propertyKey, params);
    } else {
        // On class
        for (const protoPropertyKey of Object.getOwnPropertyNames(target)) {
            // tslint:disable-next-line
            if (typeof (<any>target)[protoPropertyKey] !== 'function' ||
                protoPropertyKey === 'constructor') {
                continue;
            }
            addMeta(target, protoPropertyKey, params);
        }
    }
};
