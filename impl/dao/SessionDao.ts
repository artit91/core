import * as crypto from 'crypto';
import * as UUID from 'uid-safe';

import { config } from 'core';
import { Exception } from 'core';
import { IContext } from 'core';
import { ISessionDao } from 'lib/dao/ISessionDao';
import { ISession } from 'lib/entity/ISession';

import { Collection } from 'mongodb';
import { Db } from 'mongodb';
import { InsertOneWriteOpResult } from 'mongodb';
import { FindAndModifyWriteOpResultObject } from 'mongodb';
import { ObjectID } from 'mongodb';

/**
 * Implementation of ISessionDao
 */
export class SessionDao implements ISessionDao {
    private mongo: Db;
    private now: number;
    private timeout: number;
    private collection: Collection;
    private secret: string;
    constructor(context: IContext) {
        this.mongo = <Db>context.mongo;
        this.collection = this.mongo.collection('session');
        this.now = <number>context.now;
        this.timeout = this.now + 1000 * <number>config('services.session.timeout');
        this.secret = <string>config('services.session.secret');
    }
    public create(userId: string) : Promise<ISession> {
        return this.collection.insertOne({
            key: UUID.sync(32),
            lastModified: new Date(this.now),
            expires: new Date(this.timeout),
            userId
        }).then(
            ({ ops: [res]}: InsertOneWriteOpResult) => <ISession>this.makeSession(res)
        );
    }
    public byId(id: string) : Promise<ISession | void> {
        let decrypted: string;
        try {
            decrypted = this.decryptSessionId(id);
        } catch (e) {
            return Promise.resolve();
        }

        return this.collection.findOneAndUpdate(
            {
                key: decrypted,
                $or: [
                    { expires: { $exists: false } },
                    { expires: { $gt: new Date(this.now) } }
                ]
            },
            {
                $set: {
                    lastModified: new Date(this.now),
                    expires: new Date(this.timeout)
                }
            },
            {
                returnOriginal: false
            }
        ).then(({ value }: FindAndModifyWriteOpResultObject) => this.makeSession(value));
    }
    private decryptSessionId(sessionId: string) : string {
        const decipher: crypto.Decipher = crypto.createDecipher('aes-256-cbc', this.secret);
        let decrypted: string = decipher.update(sessionId, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
    private encryptSessionId(sessionId: string) : string {
        const cipher: crypto.Cipher = crypto.createCipher('aes-256-cbc', this.secret);
        let crypted: string = cipher.update(sessionId, 'utf8', 'hex');
        crypted += cipher.final('hex');

        return crypted;
    }
    // tslint:disable-next-line
    private makeSession(result: any) : ISession | void {
        if (!result) {
            return;
        }

        return Object.freeze({
            id: this.encryptSessionId(result.key),
            expires: result.expires,
            lastModified: result.lastModified,
            userId: result.userId
        });
    }
}
