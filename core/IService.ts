import { IContext, IEvent } from 'core';

/**
 * Every service method should implement this interface
 */
export type IService<T> = (event: IEvent, context: IContext) => Promise<T>;
