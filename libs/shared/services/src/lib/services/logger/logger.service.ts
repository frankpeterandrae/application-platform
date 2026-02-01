/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable, InjectionToken } from '@angular/core';

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
 */
export type LogOutput = (source: string | undefined, level: LogLevel, ...objects: unknown[]) => void;

/**
 * Injection token for the logger source.
 */
export const LOGGER_SOURCE = new InjectionToken<string>('LOGGER_SOURCE');

/**
 * Logger service for logging messages with different log levels.
 *
 * This service provides a centralized logging mechanism with:
 * - Multiple log levels (Error, Warn, Info, Debug)
 * - Optional source identification for log messages
 * - Custom output handlers for log redirection
 * - Production mode to disable logging
 *
 * @example
 * ```typescript
 * // Basic usage
 * constructor(private logger: Logger) {}
 *
 * this.logger.info('User logged in', userId);
 * this.logger.error('Failed to load data', error);
 *
 * // With custom source
 * providers: [
 *   { provide: LOGGER_SOURCE, useValue: 'MyComponent' }
 * ]
 *
 * // Configure production mode
 * Logger.setProductionMode({ disable: true });
 *
 * // Add custom output handler
 * Logger.addOutput((source, level, ...objects) => {
 *   // Send logs to remote service
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class Logger {
	private readonly source = inject(LOGGER_SOURCE, { optional: true });

	private static disabled = false;
	private static readonly level: LogLevel = LogLevel.Debug;
	private static readonly outputs: LogOutput[] = [];

	/**
	 * Configures production mode for the logger.
	 * When disabled is set to true, all logging will be suppressed.
	 *
	 * @param setting - Configuration object
	 * @param setting.disable - If true, disables all logging output
	 *
	 * @example
	 * ```typescript
	 * // Disable logging in production
	 * if (environment.production) {
	 *   Logger.setProductionMode({ disable: true });
	 * }
	 * ```
	 */
	public static setProductionMode(setting: { disable: boolean }): void {
		Logger.disabled = setting.disable;
	}

	/**
	 * Adds a custom output handler for log messages.
	 * Output handlers are called for all log messages that pass the level filter.
	 * Multiple output handlers can be registered.
	 *
	 * @param output - A function that receives log messages and can process them
	 *                (e.g., send to remote logging service, store in database)
	 *
	 * @example
	 * ```typescript
	 * // Add a custom output to send errors to a monitoring service
	 * Logger.addOutput((source, level, ...objects) => {
	 *   if (level === LogLevel.Error) {
	 *     monitoringService.reportError(source, objects);
	 *   }
	 * });
	 * ```
	 */
	public static addOutput(output: LogOutput): void {
		Logger.outputs.push(output);
	}

	/**
	 * Logs an informational message.
	 * Info level messages are used for general informational messages about application flow.
	 *
	 * @param objects - Any number of objects to log (will be passed to console.info)
	 *
	 * @example
	 * ```typescript
	 * this.logger.info('Application started');
	 * this.logger.info('User action:', action, 'by user:', userId);
	 * ```
	 */
	public info(...objects: unknown[]): void {
		this.log('info', LogLevel.Info, objects);
	}

	/**
	 * Logs a warning message.
	 * Warn level messages are used for potentially problematic situations that don't prevent execution.
	 *
	 * @param objects - Any number of objects to log (will be passed to console.warn)
	 *
	 * @example
	 * ```typescript
	 * this.logger.warn('Deprecated API used');
	 * this.logger.warn('Performance threshold exceeded:', duration, 'ms');
	 * ```
	 */
	public warn(...objects: unknown[]): void {
		this.log('warn', LogLevel.Warn, objects);
	}

	/**
	 * Logs an error message.
	 * Error level messages are used for error conditions and exceptions.
	 *
	 * @param objects - Any number of objects to log (will be passed to console.error)
	 *
	 * @example
	 * ```typescript
	 * this.logger.error('Failed to load data', error);
	 * this.logger.error('HTTP request failed:', response.status, response.statusText);
	 * ```
	 */
	public error(...objects: unknown[]): void {
		this.log('error', LogLevel.Error, objects);
	}

	/**
	 * Logs a debug message.
	 * Debug level messages are used for detailed diagnostic information during development.
	 *
	 * @param objects - Any number of objects to log (will be passed to console.debug)
	 *
	 * @example
	 * ```typescript
	 * this.logger.debug('Component initialized with config:', config);
	 * this.logger.debug('State updated:', oldState, '->', newState);
	 * ```
	 */
	public debug(...objects: unknown[]): void {
		this.log('debug', LogLevel.Debug, objects);
	}

	/**
	 * Internal method that handles the actual logging logic.
	 * Checks if logging is enabled and level is appropriate, then outputs to console
	 * and any registered custom output handlers.
	 *
	 * @param method - The console method to call ('info', 'warn', 'error', or 'debug')
	 * @param level - The log level for this message
	 * @param objects - The objects to log
	 */
	private log(method: 'info' | 'warn' | 'error' | 'debug', level: LogLevel, objects: unknown[]): void {
		if (Logger.disabled || level > Logger.level) return;

		const prefix = this.source ? `[${this.source}]` : undefined;
		const args = prefix ? [prefix, ...objects] : [...objects];

		// Call the console method in a type-safe way.
		const consoleMethod = (console as unknown as Record<string, (...a: unknown[]) => void>)[method];
		try {
			consoleMethod(...args);
		} catch {
			// Ignore console errors
		}

		for (const output of Logger.outputs) {
			try {
				output(this.source ?? undefined, level, ...objects);
			} catch {
				// Ignore output errors to avoid breaking application flow
			}
		}
	}
}
