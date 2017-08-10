import { IContext } from 'core';
import { IUserDao } from 'lib/dao/IUserDao';
import { IUser } from 'lib/entity/IUser';

const users: IUser[] = [
    {
        id: '1',
        email: 'test@test.test',
        password: 'test',
        validated: false
    },
    {
        id: '2',
        email: 'test2@test.test',
        password: 'test',
        validated: false
    }
];

function getNextId() : string {
    return String(users.reduce(
        (max: number, user: IUser) => Math.max(
            max,
            Number(user.id)
        ),
        0
    ) + 1);
}

/**
 * Mock of IUserDao
 */
export class UserDao implements IUserDao {
    private transfer: {[s: string]: {}};
    constructor(context: IContext) {
        this.transfer = context.transfer || {};
    }
    public add (user: IUser) : Promise<IUser> {
        const newUser: IUser = {
            id: getNextId(),
            ...user
        };

        users.push(user);

        return Promise.resolve(newUser);
    }
    public byId(id: string) : Promise<IUser | void> {
        const user: IUser = users.filter(
            (act: IUser) => act.id === id
        )[0];

        return Promise.resolve(user);
    }
    public validate(id: string) : Promise<void> {
        const user: IUser = users.filter(
            (act: IUser) => act.id === id
        )[0];

        user.validated = true;

        this.transfer.validated = true;

        return Promise.resolve();
    }
    public password(id: string, password: string) : Promise<void> {
        const user: IUser = users.filter(
            (act: IUser) => act.id === id
        )[0];

        user.password = password;

        return Promise.resolve();
    }
    public byEmail(email: string) : Promise<IUser | void> {
        const user: IUser = users.filter(
            (act: IUser) => act.email === email
        )[0];

        return Promise.resolve(user);
    }
    public match(email: string, password: string) : Promise<IUser | void> {
        const user: IUser = users.filter(
            // tslint:disable-next-line
            (act: IUser) => act.email === email && act.password === password
        )[0];

        return Promise.resolve(user);
    }
}
