import { IContext, IEvent } from 'core';
import { ISession } from 'lib/entity/ISession';
import { Errors } from 'lib/Errors';
import { Auth } from 'lib/service/Auth';
import { Test } from 'test/Test';

/**
 * Test auth service
 */
class TestAuth extends Test {
    protected async testRegister() : Promise<void> {
        const event: IEvent = {
            email: 'testRegister@test.test',
            password: 'test123'
        };
        const context: IContext = {};
        // Test register
        let session: ISession = await Auth.register(event, context);
        this.assert(session.lastModified.getTime(), context.now);

        // Test validations
        let error: Boolean = false;
        try {
            session = <ISession> await Auth.register(
                {
                    ...event,
                    password: 'test'
                },
                context
            );
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.InvalidArgument);
        }
        this.assert(error, true);
        error = false;
        try {
            session = <ISession> await Auth.register(
                {
                    ...event,
                    email: 'test'
                },
                context
            );
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.InvalidArgument);
        }
        this.assert(error, true);

        // Test duplication errors
        error = false;
        try {
            session = <ISession> await Auth.register(event, context);
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.Duplicate);
        }
        this.assert(error, true);
    }
    protected async testLogin() : Promise<void> {
        const event: IEvent = {
            email: 'test@test.test',
            password: 'test'
        };
        const context: IContext = {};
        // Test login
        let session: ISession = <ISession> await Auth.login(event, context);

        this.assert(session.lastModified.getTime(), context.now);

        // Test wrong password
        let error: Boolean = false;
        try {
            session = <ISession> await Auth.login(
                { ...event, password: 'test2'},
                context
            );
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.NotFound);
        }
        this.assert(error, true);
    }
    protected async testPasswordReset() : Promise<void> {
        const transfer: {[s: string]: {}} = {};

        let event: IEvent = {
            email: 'test2@test.test'
        };
        const context: IContext = {
            transfer
        };

        // Set transfer's `token`
        await Auth.password(event, context);

        event = {
            token: <string>transfer.token,
            password: 'testtest'
        };

        // Reset password
        await Auth.reset(event, context);

        // Test login after reset
        await Auth.login(
            {
                email: 'test2@test.test',
                password: event.password
            },
            context
        );

        // Try to use the token again
        let error: Boolean = false;
        try {
            await Auth.reset(event, context);
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.NotFound);
        }
        this.assert(error, true);
    }
    protected async testValidate() : Promise<void> {
        const transfer: {[s: string]: {}} = {};

        let event: IEvent = {
            email: 'test@test.test'
        };
        const context: IContext = {
            transfer
        };

        // Set transfer's `token`
        await Auth.email(event, context);

        event = {
            token: <string>transfer.token
        };

        // Validate email, set transfer's `validated`
        await Auth.validate(event, context);

        // Test if validated
        this.assert(transfer.validated, true);

        // Try to use the token again
        let error: Boolean = false;
        try {
            await Auth.validate(event, context);
        } catch (e) {
            error = true;
            this.assert(e.code, Errors.NotFound);
        }
        this.assert(error, true);
    }
}

new TestAuth().run();
