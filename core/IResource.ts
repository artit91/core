/**
 * Interface for creating and destoying resources.
 */
export interface IResource {
    create() : Promise<{}>;
    destroy(resource: {}) : Promise<void>;
}
