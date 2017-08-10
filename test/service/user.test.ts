import { IContext, IEvent } from 'core';
import { IUser } from 'lib/entity/IUser';
import { Errors } from 'lib/Errors';
import { User } from 'lib/service/User';
import { Test } from 'test/Test';

/**
 * Test User service
 */
class TestUser extends Test {
    protected async testMe() : Promise<void> {
        const user: IUser = await User.me({sessionId: '1'}, {});

        this.assert(user.email, 'test@test.test');
    }
    protected async testFetch() : Promise<void> {
        let user: IUser = await User.fetch({sessionId: '1', userId: '2'}, {});

        this.assert(user.email, 'test2@test.test');

        // Test if user does not exist
        let error: Boolean = false;
        try {
            user = await User.fetch({sessionId: '1', userId: '-1'}, {});
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.NotFound);
        }
        this.assert(error, true);
    }
}

new TestUser().run();
