/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { vi } from 'vitest';

import { createConsoleLogger, type LogLevel } from './logger';

describe('createConsoleLogger', () => {
	const fixedTimestamp = '2026-01-05T12:00:00.000Z';
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(fixedTimestamp));
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('log levels', () => {
		it.each([
			['debug', 'debug'],
			['info', 'info'],
			['warn', 'warn'],
			['error', 'error']
		] as const)('logs %s messages when level is %s', (level, method) => {
			const logger = createConsoleLogger({ level });

			logger[method](`test ${method} message`);

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: method,
					msg: `test ${method} message`
				})
			);
		});

		it.each([
			['debug', 4],
			['info', 3],
			['warn', 2],
			['error', 1],
			['silent', 0]
		] satisfies Array<[LogLevel, number]>)('logs the expected messages at %s level', (level, expectedCalls) => {
			const logger = createConsoleLogger({ level });

			logger.debug('debug');
			logger.info('info');
			logger.warn('warn');
			logger.error('error');

			expect(consoleLogSpy).toHaveBeenCalledTimes(expectedCalls);
		});
	});

	describe('metadata and context', () => {
		it('includes metadata in the log entry', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message', {
				userId: 123,
				action: 'login'
			});

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					userId: 123,
					action: 'login'
				})
			);
		});

		it('includes logger context in the log entry', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: {
					service: 'test-service',
					version: '1.0.0'
				}
			});

			logger.info('message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					service: 'test-service',
					version: '1.0.0'
				})
			);
		});

		it('allows metadata to override context values', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: {
					service: 'test-service',
					env: 'dev'
				}
			});

			logger.info('message', { env: 'prod' });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					service: 'test-service',
					env: 'prod'
				})
			);
		});

		it('supports null metadata values', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message', { value: null });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					value: null
				})
			);
		});
	});

	describe('child logger', () => {
		it('merges parent and child context', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'main' }
			});

			const child = logger.child({ module: 'auth' });

			child.info('message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					service: 'main',
					module: 'auth'
				})
			);
		});

		it('supports nested child loggers', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'main' }
			});

			const child = logger.child({ module: 'auth' }).child({ operation: 'login' });

			child.info('message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					service: 'main',
					module: 'auth',
					operation: 'login'
				})
			);
		});

		it('inherits the parent log level', () => {
			const logger = createConsoleLogger({ level: 'warn' });
			const child = logger.child({ module: 'test' });

			child.info('ignored');
			child.warn('logged');

			expect(consoleLogSpy).toHaveBeenCalledOnce();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'warn',
					msg: 'logged',
					module: 'test'
				})
			);
		});
	});

	describe('pretty output', () => {
		it('prints a compact entry without metadata', () => {
			const logger = createConsoleLogger({
				level: 'info',
				pretty: true
			});

			logger.info('message');

			expect(consoleLogSpy).toHaveBeenCalledWith(`${fixedTimestamp} INFO message`, '');
		});

		it('includes the structured entry when metadata is present', () => {
			const logger = createConsoleLogger({
				level: 'info',
				pretty: true
			});

			logger.info('message', { userId: 123 });

			expect(consoleLogSpy).toHaveBeenCalledWith(`${fixedTimestamp} INFO message`, {
				ts: fixedTimestamp,
				level: 'info',
				msg: 'message',
				userId: 123
			});
		});
	});
});
