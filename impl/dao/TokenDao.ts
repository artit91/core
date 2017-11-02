import * as crypto from 'crypto';
import * as UUID from 'uid-safe';

import { config } from 'core';
import { Exception } from 'core';
import { IContext } from 'core';
import { ITokenDao } from 'lib/dao/ITokenDao';
import { IToken } from 'lib/entity/IToken';

import { Collection } from 'mongodb';
import { Db } from 'mongodb';
import { InsertOneWriteOpResult } from 'mongodb';
import { FindAndModifyWriteOpResultObject } from 'mongodb';
import { ObjectID } from 'mongodb';

/**
 * Implementation of ITokenDao
 */
export class TokenDao implements ITokenDao {
    private mongo: Db;
    private now: number;
    private timeout: number;
    private collection: Collection;
    private secret: string;
    constructor(context: IContext) {
        this.mongo = <Db>context.mongo;
        this.collection = this.mongo.collection('token');
        this.now = <number>context.now;
        this.timeout = this.now + 1000 * <number>config('services.token.timeout');
        this.secret = <string>config('services.token.secret');
    }
    public create(userId: string, category: string) : Promise<IToken> {
        return this.collection.deleteMany({
            userId,
            category
        }).then(() => {
            return this.collection.insertOne({
                key: UUID.sync(32),
                lastModified: new Date(this.now),
                expires: new Date(this.timeout),
                userId,
                category
            }).then(
                ({ ops: [res]}: InsertOneWriteOpResult) => <IToken>this.makeToken(res)
            );
        });
    }
    public byId(id: string) : Promise<IToken | void> {
        let decrypted: string;
        try {
            decrypted = this.dencryptTokenId(id);
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
        ).then(({ value }: FindAndModifyWriteOpResultObject) => this.makeToken(value));
    }
    public remove(id: string) : Promise<void> {
        let decrypted: string;
        try {
            decrypted = this.dencryptTokenId(id);
        } catch (e) {
            return Promise.resolve();
        }

        return this.collection.remove({
            key: decrypted
        }).then(() => Promise.resolve());
    }
    private dencryptTokenId(sessionId: string) : string {
        const decipher: crypto.Decipher = crypto.createDecipher('aes-256-ctr', this.secret);
        let decrypted: string = decipher.update(sessionId, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
    private encryptTokenId(sessionId: string) : string {
        const cipher: crypto.Cipher = crypto.createCipher('aes-256-ctr', this.secret);
        let crypted: string = cipher.update(sessionId, 'utf8', 'hex');
        crypted += cipher.final('hex');

        return crypted;
    }
    // tslint:disable-next-line
    private makeToken(result: any) : IToken | void {
        if (!result) {
            return;
        }

        return Object.freeze({
            id: this.encryptTokenId(result.key),
            expires: result.expires,
            lastModified: result.lastModified,
            userId: result.userId,
            category: result.category
        });
    }
}
