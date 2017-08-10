import { IToken } from 'lib/entity/IToken';

/**
 * Access token related data
 */
export interface ITokenDao {
    byId(id: string) : Promise<IToken | void>;
    remove(id: string) : Promise<void>;
    create(userId: string, category: string) : Promise<IToken>;
}
