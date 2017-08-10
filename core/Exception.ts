/**
 * Exception class extending `Error` prototype.
 */
export class Exception extends Error {
    public code: number;
    public msgParams: {[s: string]: string};
    /**
     * @param code Error code defined in your service backend
     * @param message Message template name e.g. `'internal_server_error'`
     * @param messageParams Parameters for the message template
     */
    constructor(
        code: number = -1,
        message: string = '',
        messageParams: {[s: string]: string} = {}
    ) {
        super();
        // this.message is not `enumerable` by default
        Object.defineProperty(
            this,
            'message',
            {
                value: message,
                configurable: false,
                enumerable: true,
                writable: false
            }
        );
        this.code = code;
        this.msgParams = messageParams;
        const stack: string | void = new Error().stack;
        if (stack) {
            // delete the first line of stack
            this.stack = stack.replace(/\n.*\n/, '\n');
        }
    }
}
