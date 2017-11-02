import { config, IResource } from 'core';
import * as mongodb from 'mongodb';

/**
 * MongoDB resource
 */
class Mongo implements IResource {
    public create() : Promise<mongodb.Db> {
        const client: mongodb.MongoClient = mongodb.MongoClient;

        return client.connect(<string>config('services.mongodb.uris'));
    }
    public destroy(db: mongodb.Db) : Promise<void> {
        try {
            return db.close();
        } catch (e) {
            return Promise.resolve();
        }
    }
}

export const mongo: IResource = new Mongo();
