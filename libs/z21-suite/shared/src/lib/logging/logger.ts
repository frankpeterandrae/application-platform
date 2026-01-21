/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_ORDER: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
	silent: 99
};

export interface Logger {
	debug(msg: string, meta?: Record<string, unknown>): void;
	info(msg: string, meta?: Record<string, unknown>): void;
	warn(msg: string, meta?: Record<string, unknown>): void;
	error(msg: string, meta?: Record<string, unknown>): void;
	child(ctx: Record<string, unknown>): Logger;
}

type LoggerOptions = {
	level: LogLevel;
	pretty?: boolean;
	context?: Record<string, unknown>;
};

/**
 * Creates a console logger instance.
 * @param opts - Logger configuration options
 * @returns A Logger instance
 */
export function createConsoleLogger(opts: LoggerOptions): Logger {
	const level = opts.level;
	const pretty = opts.pretty ?? false;
	const baseCtx = opts.context ?? {};

	/**
	 * Emits a log message at the specified level.
	 * @param lvl - Log level
	 * @param msg - Log message
	 * @param meta - Additional metadata
	 */
	function emit(lvl: LogLevel, msg: string, meta?: Record<string, unknown>): void {
		if (LEVEL_ORDER[lvl] < LEVEL_ORDER[level]) {
			return;
		}

		const entry = {
			ts: new Date().toISOString(),
			level: lvl,
			msg,
			...baseCtx,
			...meta
		};

		if (pretty) {
			// eslint-disable-next-line no-console
			console.log(`${entry.ts} ${lvl.toUpperCase()} ${msg}`, Object.keys(entry).length > 3 ? entry : '');
		} else {
			// eslint-disable-next-line no-console
			console.log(JSON.stringify(entry));
		}
	}

	return {
		debug: (m, meta) => emit('debug', m, meta),
		info: (m, meta) => emit('info', m, meta),
		warn: (m, meta) => emit('warn', m, meta),
		error: (m, meta) => emit('error', m, meta),
		child(ctx): Logger {
			return createConsoleLogger({
				level,
				pretty,
				context: { ...baseCtx, ...ctx }
			});
		}
	};
}
