import * as crypto from 'crypto';

import { IContext } from 'core';
import { IUserDao } from 'lib/dao/IUserDao';
import { IUser } from 'lib/entity/IUser';

import { Collection } from 'mongodb';
import { Db } from 'mongodb';
import { InsertOneWriteOpResult } from 'mongodb';
import { ObjectID } from 'mongodb';

/**
 * Implementation of IUserDao
 */
export class UserDao implements IUserDao {
    private mongo: Db;
    private collection: Collection;
    private saltCollection: Collection;
    constructor(context: IContext) {
        this.mongo = <Db>context.mongo;
        this.collection = this.mongo.collection('users');
        this.saltCollection = this.mongo.collection('salt');
    }
    public async add (user: IUser) : Promise<IUser> {
        const salt: string = this.genSalt();

        user.password = this.hashPassword(<string>user.password, salt);

        const [userRes, ...ignore] = await Promise.all([
            this.collection.insertOne(
                user
            ).then(
                ({ ops: [res]}: InsertOneWriteOpResult) => this.makeUser(res)
            ),
            this.saltCollection.updateOne(
                { email: user.email },
                { $set: { salt: salt } },
                { upsert: true }
            )
        ]);

        return Promise.resolve(<IUser>userRes);
    }
    public byId(id: string) : Promise<IUser | void> {
        let oId: ObjectID;
        try {
            oId = new ObjectID(id);
        } catch (e) {
            return Promise.resolve();
        }

        return this.collection.findOne({
            _id: oId
        }).then(this.makeUser);
    }
    public byEmail(email: string) : Promise<IUser | void> {
        return this.collection.findOne({
            email: email
        }).then(this.makeUser);
    }
    public validate(id: string) : Promise<void> {
        return this.collection.update(
            { _id: new ObjectID(id) },
            { $set: { validated: true } }
        ).then(() => Promise.resolve());
    }
    public async password(id: string, password: string) : Promise<void> {
        const user: IUser = <IUser> await this.byId(id);
        const salt: string = this.genSalt();
        const newPassword: string = this.hashPassword(password, salt);

        return Promise.all([
            this.collection.update(
                { _id: new ObjectID(id) },
                { $set: { password: newPassword } }
            ),
            this.saltCollection.updateOne(
                { email: user.email },
                { $set: { salt: salt } },
                { upsert: true }
            )
        ]).then(() => Promise.resolve());
    }
    public async match(email: string, password: string) : Promise<IUser | void> {
        const hash: string = this.hashPassword(
            password,
            (await this.saltCollection.findOne({
                email: email
            })).salt
        );

        return this.collection.findOne({
            email: email,
            password: hash
        }).then(this.makeUser);
    }
    private hashPassword(password: string, salt: string) : string {
        const hash: crypto.Hmac = crypto.createHmac('sha512', salt);
        hash.update(password);

        return hash.digest('hex');
    }
    private genSalt() : string {
        return crypto.randomBytes(5).toString('hex').slice(0, 10);
    }
    // tslint:disable-next-line
    private makeUser(result: any): IUser | void {
        if (!result) {
            return;
        }

        return Object.freeze({
            id: result._id.toString(),
            email: result.email,
            validated: result.validated
        });
    }
}
