import * as validator from 'validator';

import { Exception } from 'core';
import { IContext } from 'core';
import { IEvent } from 'core';
import { IService } from 'core';
import { Require } from 'core';
import { Service } from 'core';

import { IUserDao } from 'lib/dao/IUserDao';
import { IUser } from 'lib/entity/IUser';

import { Errors } from 'lib/Errors';

import { Authenticate } from 'lib/decorator/Authenticate';

import { UserDao } from 'src/dao/UserDao';

/**
 * User service
 */
@Service
@Authenticate
export class User {
    /**
     * Gets own user data
     */
    public static me: IService<IUser> = async(event, context) => {
        return <IUser>context.user;
    }
    /**
     * Gets others user data
     */
    @Require('userId')
    public static fetch: IService<IUser> = async(event, context) => {
        const userDao: IUserDao = new UserDao(context);
        let user: IUser | void;

        user = await userDao.byId(event.userId);

        if (!user) {
            throw new Exception(
                Errors.NotFound,
                'user_not_found',
                { userId: event.userId }
            );
        }

        return user;
    }
}
