// tslint:disable-next-line
import 'reflect-metadata';

import { IContext } from 'core';
import { IEvent } from 'core';
import { IService } from 'core';

export const requirementMetadataKey: string = 'requirement';

function addMeta(
    target: {},
    propertyKey: string,
    params: string[]
) : void {
    const requirements: string[] = Reflect.getOwnMetadata(
        requirementMetadataKey,
        target,
        propertyKey
    ) || [];
    for (const param of params) {
        if (requirements.indexOf(param) === -1) {
            requirements.push(param);
        }
    }
    Reflect.defineMetadata(
        requirementMetadataKey,
        requirements,
        target,
        propertyKey
    );
}

/**
 * @Require decorator for services
 * Usage:
 * `
 *  @Service
 *  @Require('sessionId')
 *  export class Auth {
 *    @Require('email', 'password')
 *    public static register: IService<ISession> = async(event, context) => { }
 *  }
 * `
 */
export const Require = (...params: string[]) : Function => ( // tslint:disable-line
    target: {},
    propertyKey?: string,
    propertyDescriptor?: TypedPropertyDescriptor<IService<{}>>
) : void => {
    // @Require on property
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
