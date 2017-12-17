import { IToken } from 'lib/entity/IToken';

/**
 * Access token related data
 */
export interface ITokenDao {
    byId(id: string, category: string) : Promise<IToken | void>;
    remove(id: string, category: string) : Promise<void>;
    create(userId: string, category: string) : Promise<IToken>;
}
