import * as validator from 'validator';

import { Exception } from 'core';
import { IContext } from 'core';
import { IEvent } from 'core';
import { Require } from 'core';
import { Resource } from 'core';
import { IService } from 'core';

import { ITokenDao } from 'lib/dao/ITokenDao';
import { IUserDao } from 'lib/dao/IUserDao';

import { ISession } from 'lib/entity/ISession';

import { Errors } from 'lib/Errors';

import { TokenDao } from 'src/dao/TokenDao';
import { UserDao } from 'src/dao/UserDao';

const overiddenMetadataKey: Symbol = Symbol('overridden');

function decorateService(
    target: {},
    propertyKey: string,
    propertyDescriptor?: TypedPropertyDescriptor<IService<{} | void>>
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
    let fn: IService<{} | void> | void = (<any>target)[propertyKey];
    if (propertyDescriptor) {
        fn = propertyDescriptor.value;
    }

    const overrideFn: IService<{} | void> = async(
        event: IEvent = {},
        context: IContext = {}
    ) : Promise<{} | void> => {
        if (!fn) {
            throw new Exception(
                -1,
                'reflection_error',
                {
                    decorator: 'Required',
                    propertyKey
                }
            );
        }

        const tokenDao: ITokenDao = new TokenDao(context);
        const userDao: IUserDao = new UserDao(context);

        let session: ISession | void;

        if (validator.isHexadecimal(event.sessionId)) {
            session = await tokenDao.byId(event.sessionId, 'session');
        }

        if (!session) {
            throw new Exception(
                Errors.NotFound,
                'session_not_found',
                { sessionId: event.sessionId }
            );
        }

        context.user = await userDao.byId(session.userId);

        return fn(event, context);
    };

    if (propertyDescriptor) {
        propertyDescriptor.value = overrideFn;
    } else {
        // tslint:disable-next-line
        (<any>target)[propertyKey] = overrideFn;
    }

    Reflect.defineMetadata(
        overiddenMetadataKey,
        true,
        target,
        propertyKey
    );
}

/**
 * @Authenticate decorator for services.
 * Using:
 *   @Require('sessionId')
 *   @Resource('mongo', 'now')
 * When applied to a service,
 * you don't have to use Required or Resource for the specified keys.
 * Usage:
 * `
 *  @Service
 *  @Authenticate
 *  export class User {
 *    public static me: IService<IUser> = async(event, context) => {
 *      return Promise.resolve(<IUser>context.user);
 *    }
 *  }
 * `
 */
export function Authenticate(
    target: {},
    propertyKey?: string,
    propertyDescriptor?: TypedPropertyDescriptor<IService<{}>>
) : void {
    // @Authenticated on property
    if (propertyKey) {
        decorateService(target, propertyKey, propertyDescriptor);
    } else {
        // On class
        for (const protoPropertyKey of Object.getOwnPropertyNames(target)) {
            // tslint:disable-next-line
            if (typeof (<any>target)[protoPropertyKey] !== 'function' ||
                protoPropertyKey === 'constructor') {
                continue;
            }
            decorateService(target, protoPropertyKey);
        }
    }
    Resource('mongo', 'now')(target, propertyKey, propertyDescriptor);
    Require('sessionId')(target, propertyKey, propertyDescriptor);
}
