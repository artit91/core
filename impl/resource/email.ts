import {
    config,
    IResource,
    Logger
} from 'core';

export class EmailSender {
    public send(email: string, topic: string, message: string) : Promise<void> {
        const logger: Logger = new Logger('email');

        logger.warn(`${email}: [${topic}]: ${message}`);

        return Promise.resolve();
    }
}

/**
 * Dummy email resource
 */
class Email implements IResource {
    public create() : Promise<EmailSender> {
        return Promise.resolve(new EmailSender());
    }
    public destroy(emailSender: EmailSender) : Promise<void> {
        return Promise.resolve();
    }
}

export const email: IResource = new Email();
