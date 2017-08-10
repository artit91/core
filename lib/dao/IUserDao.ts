import { IUser } from 'lib/entity/IUser';

/**
 * Access user related data
 */
export interface IUserDao {
    add(user: IUser) : Promise<IUser>;
    byId(id: string) : Promise<IUser | void>;
    validate(id: string) : Promise<void>;
    password(id: string, password: string) : Promise<void>;
    byEmail(username: string) : Promise<IUser | void>;
    match(username: string, password: string) : Promise<IUser | void>;
}
