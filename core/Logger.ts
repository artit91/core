import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { config } from 'core';

/**
 * Levels of logging
 */
enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

/**
 * One line of log
 */
class LoggerItem {
    public level: LogLevel;
    public timestamp: string;
    private name: string;
    private message: string;
    private data?: {};
    constructor(
        timestamp: string,
        level: LogLevel,
        name: string,
        message: string,
        data?: {}
    ) {
        this.timestamp = timestamp;
        this.level = level;
        this.name = name;
        this.message = message;
        this.data = data;
    }
    /**
     * Simple colored text format for console
     */
    public format() : string {
        const levelColors: {[s: string]: string} = {
            [LogLevel.ERROR]: 'red',
            [LogLevel.WARN]: 'red',
            [LogLevel.INFO]: 'green',
            [LogLevel.DEBUG]: 'green'
        };
        const timeFormat: (ts: string) => string = (
            ts: string
        ) : string => new Date(ts).toTimeString().split(' ')[0];
        let ret: string = [
            this.addColor(timeFormat(this.timestamp), 'magenta'),
            this.addColor(LogLevel[this.level], levelColors[this.level]),
            this.addColor(this.name, 'yellow'),
            this.message
        ].join('|') + '\n';

        if (this.data !== undefined) {
            ret += `${this.addColor('data:', 'cyan')} ${
                util.inspect(this.data, {
                    showHidden: true,
                    depth: 2,
                    colors: true
                }
            )}\n`;
        }

        return ret;
    }
    /**
     * Format line for JSON logging
     */
    public formatJson() : string {
        const res: {[s: string]: {}} = {
            timestamp: this.timestamp,
            level: LogLevel[this.level],
            name: this.name,
            message: this.message
        };

        if (this.data !== undefined) {
            try {
                JSON.stringify(this.data);
                res.data = this.data;
            } catch (ignore) {
                res.data = 'circular_structure';
            }
            const stack: string | void = (<Error>this.data).stack;
            if (stack !== undefined) {
                res.stack = String(stack);
            }
        }

        return `${JSON.stringify(res)}\n`;
    }
    /**
     * Colors the input text for terminal output.
     * @param text Text to color
     * @param color Target color
     */
    private addColor(text: string, color: string) : string {
        const colors: {[s: string]: string} = {
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m'
        };

        return `${colors[color]}${text}${colors.reset}`;
    }
}

/**
 * Easy to use logging utility
 * with console and JSON format
 * and stdout(plus stderr) and file output.
 */
export class Logger {
    private name: string;
    private level: LogLevel = LogLevel.DEBUG;
    private config: {[s: string]: string};
    /**
     * @param name Name of logger e.g. service, resource name.
     */
    constructor(name: string = 'root') {
        this.config = <{}>config('logging');
        this.name = name;
        const level: string = this.config.level;
        for (const lLevel of [
            LogLevel.DEBUG,
            LogLevel.INFO,
            LogLevel.WARN,
            LogLevel.ERROR
        ]) {
            if (LogLevel[lLevel] === level) {
                this.level = lLevel;
            }
        }
    }
    /**
     * Debug message.
     * @param message Message to be logged.
     * @param data Payload of message.
     */
    public debug(message: string, data?: {} | Error) : void {
        this.log(this.loggerItem(LogLevel.DEBUG, message, data));
    }
    /**
     * Info message.
     * @param message Message to be logged.
     * @param data Payload of message.
     */
    public info(message: string, data?: {} | Error) : void {
        this.log(this.loggerItem(LogLevel.INFO, message, data));
    }
    /**
     * Warn message.
     * @param message Message to be logged.
     * @param data Payload of message.
     */
    public warn(message: string, data?: {} | Error) : void {
        this.log(this.loggerItem(LogLevel.WARN, message, data));
    }
    /**
     * Error message.
     * @param message Message to be logged.
     * @param data Payload of message.
     */
    public error(message: string, data?: {} | Error) : void {
        this.log(this.loggerItem(LogLevel.ERROR, message, data));
    }
    /**
     * Factory method of a LoggerItem
     * @param level Level of item
     * @param message Message of item
     * @param data Payload of item
     */
    private loggerItem(
        level: LogLevel,
        message: string,
        data?: {}
    ) : LoggerItem {
        return new LoggerItem(
            new Date().toISOString(),
            level,
            this.name,
            message,
            data
        );
    }
    /**
     * Write an entry to the target output
     * @param text Text to be written
     * @param timestamp Timestamp of entry
     * @param level Level of message
     */
    private write(text: string, timestamp: string, level: LogLevel) : void {
        if (this.config.output !== 'file') {
            if (level in [LogLevel.DEBUG, LogLevel.INFO]) {
                process.stdout.write(text);
            } else {
                process.stderr.write(text);
            }
            return;
        }

        const rotToPath: () => string = () : string => {
            const date: Date = new Date(timestamp);
            const isoDate: string = date.toISOString().split('T')[0];
            if (this.config.rotation === 'daily') {
                return `${isoDate}.log`;
            }
            return `${isoDate}-${date.getUTCHours()}.log`;
        };

        const filepath: string = path.join(
            this.config.directory
        );

        filepath.split(
            '/'
        ).reduce(
            (cPath: string, folder: string) : string => {
                cPath = path.join(cPath, folder, '/');
                if (!fs.existsSync(cPath)) {
                    fs.mkdirSync(cPath);
                }
                return cPath;
            },
            ''
        );

        const file: string = path.join(
            filepath,
            rotToPath()
        );

        fs.appendFile(file, text);
    }
    /**
     * Stringifies LoggerItem and writes an entry to the output.
     * Only writes when the item's log level is high enought.
     * @param item LoggerItem to write
     */
    private log(item: LoggerItem) : void {
        if (item.level < this.level) {
            return;
        }
        let fn: () => string = item.format;
        if (this.config.format === 'json') {
            fn = item.formatJson;
        }
        this.write(fn.apply(item), item.timestamp, item.level);
    }
}
