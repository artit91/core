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

type TokenConfigItem = {
    timeout: number;
    secret: string;
};

type TokenConfig = {
    [key: string]: TokenConfigItem
};

/**
 * Implementation of ITokenDao
 */
export class TokenDao implements ITokenDao {
    private mongo: Db;
    private now: number;
    private collection: Collection;
    private config: TokenConfig;
    constructor(context: IContext) {
        this.mongo = <Db>context.mongo;
        this.collection = this.mongo.collection('token');
        this.now = <number>context.now;
        this.config = <TokenConfig>config('services.token');
    }
    public create(userId: string, category: string) : Promise<IToken> {
        const tokenConfig: TokenConfigItem = this.config[category];
        const timeout: number = this.now + 1000 * tokenConfig.timeout;

        return this.collection.deleteMany({
            userId,
            category
        }).then(() => {
            return this.collection.insertOne({
                key: UUID.sync(32),
                lastModified: new Date(this.now),
                expires: new Date(timeout),
                userId,
                category
            }).then(
                ({ ops: [res]}: InsertOneWriteOpResult) => <IToken>this.makeToken(res)
            );
        });
    }
    public byId(id: string, category: string) : Promise<IToken | void> {
        const tokenConfig: TokenConfigItem = this.config[category];
        const timeout: number = this.now + 1000 * tokenConfig.timeout;

        let decrypted: string;
        try {
            decrypted = this.dencryptTokenId(id, category);
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
                    expires: new Date(timeout)
                }
            },
            {
                returnOriginal: false
            }
        ).then(({ value }: FindAndModifyWriteOpResultObject) => this.makeToken(value));
    }
    public remove(id: string, category: string) : Promise<void> {
        let decrypted: string;
        try {
            decrypted = this.dencryptTokenId(id, category);
        } catch (e) {
            return Promise.resolve();
        }

        return this.collection.remove({
            key: decrypted
        }).then(() => Promise.resolve());
    }
    private dencryptTokenId(sessionId: string, category: string) : string {
        const tokenConfig: TokenConfigItem = this.config[category];
        const secret: string = tokenConfig.secret;
        const decipher: crypto.Decipher = crypto.createDecipher('aes-256-cbc', secret);
        let decrypted: string = decipher.update(sessionId, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
    private encryptTokenId(sessionId: string, category: string) : string {
        const tokenConfig: TokenConfigItem = this.config[category];
        const secret: string = tokenConfig.secret;
        const cipher: crypto.Cipher = crypto.createCipher('aes-256-cbc', secret);
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
            id: this.encryptTokenId(result.key, result.category),
            expires: result.expires,
            lastModified: result.lastModified,
            userId: result.userId,
            category: result.category
        });
    }
}
