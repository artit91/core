import { ISession } from 'lib/entity/ISession';

/**
 * Access session related data
 */
export interface ISessionDao {
    byId(id: string) : Promise<ISession | void>;
    create(userId: string) : Promise<ISession>;
}
