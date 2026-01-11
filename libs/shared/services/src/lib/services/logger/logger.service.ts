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
 */
@Injectable({ providedIn: 'root' })
export class Logger {
	private readonly source = inject(LOGGER_SOURCE, { optional: true });

	private static disabled = false;
	private static readonly level: LogLevel = LogLevel.Debug;
	private static readonly outputs: LogOutput[] = [];

	/**
	 *
	 */
	public static setProductionMode(setting: { disable: boolean }): void {
		Logger.disabled = setting.disable;
	}

	/**
	 *
	 */
	public static addOutput(output: LogOutput): void {
		Logger.outputs.push(output);
	}

	/**
	 *
	 */
	public info(...objects: unknown[]): void {
		this.log('info', LogLevel.Info, objects);
	}

	/**
	 *
	 */
	public warn(...objects: unknown[]): void {
		this.log('warn', LogLevel.Warn, objects);
	}

	/**
	 *
	 */
	public error(...objects: unknown[]): void {
		this.log('error', LogLevel.Error, objects);
	}

	/**
	 *
	 */
	public debug(...objects: unknown[]): void {
		this.log('debug', LogLevel.Debug, objects);
	}

	/**
	 *
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
