import { config, IResource } from 'core';

export class EmailSender {
    public send(address: string, topic: string, message: string) : Promise<void> {
        return Promise.resolve();
    }
}

/**
 * Mock of email resource
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
