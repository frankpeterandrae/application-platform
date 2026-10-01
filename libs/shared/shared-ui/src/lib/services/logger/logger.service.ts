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
 * Provides centralized logging with optional source information and custom output handlers.
 */
@Injectable({ providedIn: 'root' })
export class Logger {
	private readonly source = inject(LOGGER_SOURCE, { optional: true });

	private static disabled = false;
	private static readonly level: LogLevel = LogLevel.Debug;
	private static readonly outputs: LogOutput[] = [];

	/**
	 * Enables or disables all logger output.
	 *
	 * @param setting Logger configuration.
	 * @returns Nothing.
	 */
	public static setProductionMode(setting: { disable: boolean }): void {
		Logger.disabled = setting.disable;
	}

	/**
	 * Registers an additional output handler.
	 *
	 * @param output Handler invoked for each emitted log message.
	 * @returns A function that unregisters the handler.
	 */
	public static addOutput(output: LogOutput): () => void {
		Logger.outputs.push(output);

		return () => {
			const index = Logger.outputs.indexOf(output);

			if (index >= 0) {
				Logger.outputs.splice(index, 1);
			}
		};
	}

	/**
	 * Logs an informational message.
	 *
	 * @param objects Values to log.
	 * @returns Nothing.
	 */
	public info(...objects: unknown[]): void {
		this.log('info', LogLevel.Info, objects);
	}

	/**
	 * Logs an warning message.
	 *
	 * @param objects Values to log.
	 * @returns Nothing.
	 */
	public warn(...objects: unknown[]): void {
		this.log('warn', LogLevel.Warn, objects);
	}

	/**
	 * Logs an error message.
	 *
	 * @param objects Values to log.
	 * @returns Nothing.
	 */
	public error(...objects: unknown[]): void {
		this.log('error', LogLevel.Error, objects);
	}

	/**
	 * Logs an debug message.
	 *
	 * @param objects Values to log.
	 * @returns Nothing.
	 */
	public debug(...objects: unknown[]): void {
		this.log('debug', LogLevel.Debug, objects);
	}

	private log(method: 'info' | 'warn' | 'error' | 'debug', level: LogLevel, objects: unknown[]): void {
		if (Logger.disabled || level > Logger.level) return;

		const prefix = this.source ? `[${this.source}]` : undefined;
		const args = prefix ? [prefix, ...objects] : [...objects];

		const consoleMethod = (console as unknown as Record<string, (...a: unknown[]) => void>)[method];
		try {
			consoleMethod(...args);
		} catch {
			// empty catch to avoid breaking application flow if console output fails
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
