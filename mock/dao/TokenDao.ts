import { IContext } from 'core';
import { ITokenDao } from 'lib/dao/ITokenDao';
import { IToken } from 'lib/entity/IToken';

const oneDay: number = 86400 * 1000;

let tokens: IToken[] = [];

function getNextId() : string {
    return String(tokens.reduce(
        (max: number, user: IToken) => Math.max(
            max,
            Number(user.id)
        ),
        0
    ) + 1);
}

/**
 * Mock of ITokenDao
 */
export class TokenDao implements ITokenDao {
    private now: number;
    private transfer: {[s: string]: {}};
    constructor(context: IContext) {
        this.now = <number>context.now;
        this.transfer = context.transfer || {};
    }
    public create(userId: string, category: string) : Promise<IToken> {
        tokens = tokens.filter(
            (act: IToken) => (
                act.userId !== userId || act.category !== category
            )
        );

        const newToken: IToken = {
            id: getNextId(),
            lastModified: new Date(this.now),
            expires: new Date(this.now + oneDay),
            userId,
            category
        };

        tokens.push(newToken);

        this.transfer.token = <string>newToken.id;

        return Promise.resolve(newToken);
    }
    public byId(id: string) : Promise<IToken | void> {
        const token: IToken = tokens.filter(
            (act: IToken) => (
                act.id === id &&
                act.expires.getTime() > this.now
            )
        )[0];

        if (token) {
            token.lastModified = new Date(this.now);
            token.expires = new Date(this.now + oneDay);
        }

        return Promise.resolve(token);
    }
    public remove(id: string) : Promise<void> {
        tokens = tokens.filter(
            (act: IToken) => act.id !== id
        );

        return Promise.resolve();
    }
}
