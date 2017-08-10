import { IContext } from 'core';
import { ISessionDao } from 'lib/dao/ISessionDao';
import { ISession } from 'lib/entity/ISession';

const oneDay: number = 86400 * 1000;

const sessions: ISession[] = [
    {
        id: '1',
        userId: '1',
        lastModified: new Date(),
        expires: new Date(Date.now() + oneDay)
    }
];

function getNextId() : string {
    return String(sessions.reduce(
        (max: number, user: ISession) => Math.max(
            max,
            Number(user.id)
        ),
        0
    ) + 1);
}

/**
 * Mock of ISessionDao
 */
export class SessionDao implements ISessionDao {
    private now: number;
    constructor(context: IContext) {
        this.now = <number>context.now;
    }
    public create(userId: string) : Promise<ISession> {
        const newSession: ISession = {
            id: getNextId(),
            lastModified: new Date(this.now),
            expires: new Date(this.now + oneDay),
            userId
        };

        sessions.push(newSession);

        return Promise.resolve(newSession);
    }
    public byId(id: string) : Promise<ISession | void> {
        const session: ISession = sessions.filter(
            (act: ISession) => (
                act.id === id &&
                act.expires.getTime() > this.now
            )
        )[0];

        if (session) {
            session.lastModified = new Date(this.now);
            session.expires = new Date(this.now + oneDay);
        }

        return Promise.resolve(session);
    }
}
