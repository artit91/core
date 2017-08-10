import * as validator from 'validator';

import { Exception } from 'core';
import { IContext } from 'core';
import { IEvent } from 'core';
import { IService } from 'core';
import { Require } from 'core';
import { Resource } from 'core';
import { Service } from 'core';

import { ISession } from 'lib/entity/ISession';
import { IToken } from 'lib/entity/IToken';
import { IUser } from 'lib/entity/IUser';

import { ISessionDao } from 'lib/dao/ISessionDao';
import { ITokenDao } from 'lib/dao/ITokenDao';
import { IUserDao } from 'lib/dao/IUserDao';

import { Errors } from 'lib/Errors';

import { SessionDao } from 'src/dao/SessionDao';
import { TokenDao } from 'src/dao/TokenDao';
import { UserDao } from 'src/dao/UserDao';

import { EmailSender } from 'src/resource/email';

/**
 * Auth service
 */
@Service
@Resource('mongo', 'now')
export class Auth {
    /**
     * Registers a new user
     */
    @Require('email', 'password')
    public static register: IService<ISession> = async(event, context) => {
        const sessionDao: ISessionDao = new SessionDao(context);
        const userDao: IUserDao = new UserDao(context);

        if (!validator.isEmail(event.email)) {
            throw new Exception(
                Errors.InvalidArgument,
                'wrong_email_format',
                { email: event.email }
            );
        }

        if (!validator.isLength(event.password, 6, 32)) {
            throw new Exception(
                Errors.InvalidArgument,
                'wrong_password_format'
            );
        }

        const exists: IUser | void = await userDao.byEmail(event.email);

        if (exists) {
            throw new Exception(
                Errors.Duplicate,
                'email_already_exists',
                { email: event.email }
            );
        }

        const user: IUser = await userDao.add({
            email: event.email,
            password: event.password,
            validated: false
        });

        return sessionDao.create(<string>user.id);
    }
    /**
     * Logs a user in
     */
    @Require('email', 'password')
    public static login: IService<ISession> = async(event, context) => {
        const sessionDao: ISessionDao = new SessionDao(context);
        const userDao: IUserDao = new UserDao(context);

        const match: IUser | void = await userDao.match(event.email, event.password);

        if (match) {
            return sessionDao.create(<string>match.id);
        }

        throw new Exception(
            Errors.NotFound,
            'authentication_error'
        );
    }
    /**
     * Sends a password reset email
     */
    @Require('email')
    @Resource('email')
    public static password: IService<void> = async(event, context) => {
        const userDao: IUserDao = new UserDao(context);
        const tokenDao: ITokenDao = new TokenDao(context);

        if (!validator.isEmail(event.email)) {
            throw new Exception(
                Errors.InvalidArgument,
                'wrong_email_format',
                { email: event.email }
            );
        }

        const user: IUser | void = await userDao.byEmail(event.email);

        if (!user) {
            throw new Exception(
                Errors.NotFound,
                'email_not_found',
                { email: event.email }
            );
        }

        const token: IToken =  await tokenDao.create(<string>user.id, 'password');

        return (<EmailSender>context.email).send(
            event.email,
            'Password reset',
            `Please reset your password with this token: ${token.id}`
        );
    }
    /**
     * Resets the password
     */
    @Require('token', 'password')
    public static reset: IService<void> = async(event, context) => {
        const userDao: IUserDao = new UserDao(context);
        const tokenDao: ITokenDao = new TokenDao(context);

        if (!validator.isLength(event.password, 6, 32)) {
            throw new Exception(
                Errors.InvalidArgument,
                'wrong_password_format'
            );
        }

        const token: IToken | void = await tokenDao.byId(event.token);

        if (!token || token.category !== 'password') {
            throw new Exception(
                Errors.NotFound,
                'invalid_token',
                { token: event.token }
            );
        }

        return Promise.all([
            tokenDao.remove(event.token),
            userDao.password(token.userId, event.password)
        ]).then(() => Promise.resolve());
    }
    /**
     * Sends an email confirmation email
     */
    @Require('email')
    @Resource('email')
    public static email: IService<void> = async(event, context) => {
        const userDao: IUserDao = new UserDao(context);
        const tokenDao: ITokenDao = new TokenDao(context);

        if (!validator.isEmail(event.email)) {
            throw new Exception(
                Errors.InvalidArgument,
                'wrong_email_format',
                { email: event.email }
            );
        }

        const user: IUser | void = await userDao.byEmail(event.email);

        if (!user) {
            throw new Exception(
                Errors.NotFound,
                'email_not_found',
                { email: event.email }
            );
        }

        const token: IToken =  await tokenDao.create(<string>user.id, 'email');

        return (<EmailSender>context.email).send(
            event.email,
            'Email confirmation',
            `Please confirm your email with this token: ${token.id}`
        );
    }
    /**
     * Validates user by confirming email
     */
    @Require('token')
    public static validate: IService<void> = async(event, context) => {
        const userDao: IUserDao = new UserDao(context);
        const tokenDao: ITokenDao = new TokenDao(context);

        const token: IToken | void = await tokenDao.byId(event.token);

        if (!token || token.category !== 'email') {
            throw new Exception(
                Errors.NotFound,
                'invalid_token',
                { token: event.token }
            );
        }

        return Promise.all([
            tokenDao.remove(event.token),
            userDao.validate(token.userId)
        ]).then(() => Promise.resolve());
    }
}
