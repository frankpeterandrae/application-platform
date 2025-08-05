/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, InjectionToken, inject } from '@angular/core';

/**
 * Enum representing the log levels.
 */
export enum LogLevel {
	Off = 0,
	Error = 1,
	Warn = 2,
	Info = 3,
	Debug = 4
}

/**
 * Type definition for log output function.
 * @param {string | undefined} source - The source of the log message.
 * @param {LogLevel} level - The log level.
 * @param {...any} objects - The objects to log.
 */
export type LogOutput = (source: string | undefined, level: LogLevel, ...objects: any[]) => void;

/**
 * Injection token for the logger source.
 */
export const LOGGER_SOURCE = new InjectionToken<string>('LOGGER_SOURCE');

/**
 * Logger service for logging messages with different log levels.
 */
@Injectable({
	providedIn: 'root'
})
export class Logger {
	private readonly source = inject(LOGGER_SOURCE, { optional: true });

	private static disabled = false;

	private static readonly level: LogLevel = LogLevel.Debug;

	private static readonly outputs: LogOutput[] = [];

	/**
	 * Sets the logger to production mode, disabling logging if in production environment.
	 * @param {object} setting - The production mode settings.
	 * @param {boolean} setting.disable - Flag to disable logging.
	 */
	public static setProductionMode(setting: { disable: boolean }): void {
		Logger.disabled = setting.disable;
	}

	/**
	 * Logs an info message.
	 * @param {...any} objects - The objects to log.
	 */
	public info(...objects: any[]): void {
		// eslint-disable-next-line no-console
		this.log(console.info, LogLevel.Info, objects);
	}

	/**
	 * Logs a warning message.
	 * @param {...any} objects - The objects to log.
	 */
	public warn(...objects: any[]): void {
		// eslint-disable-next-line no-console
		this.log(console.warn, LogLevel.Warn, objects);
	}

	/**
	 * Logs an error message.
	 * @param {...any} objects - The objects to log.
	 */
	public error(...objects: any[]): void {
		// eslint-disable-next-line no-console
		this.log(console.error, LogLevel.Error, objects);
	}

	/**
	 * Logs a debug message.
	 * @param {...any} objects - The objects to log.
	 */
	public debug(...objects: any[]): void {
		// eslint-disable-next-line no-console
		this.log(console.debug, LogLevel.Debug, objects);
	}

	/**
	 * Logs a message with the specified log level.
	 * @param {Function} func - The console function to use for logging.
	 * @param {LogLevel} level - The log level.
	 * @param {...any} objects - The objects to log.
	 */
	private log(func: (...args: any[]) => void, level: LogLevel, objects: any[]): void {
		if (!Logger.disabled && level <= Logger.level) {
			const log = this.source ? ['[' + this.source + ']'].concat(objects) : objects;
			func.apply(console, log);
			Logger.outputs.forEach((output) => output.apply(output, [this.source ?? undefined, level, ...objects]));
		}
	}
}
