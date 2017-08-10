import { IResource } from 'core';

/**
 * Now resource
 */
class Now implements IResource {
    public create() : Promise<number> {
        return Promise.resolve(Date.now());
    }
    public destroy(timestamp: number) : Promise<void> {
        return Promise.resolve();
    }
}

export const now: IResource = new Now();
