/**
 * Every context object should be a flat map of objects.
 */
export interface IContext {
    [s: string]: {} | void;
}
