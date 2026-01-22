/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { vi } from 'vitest';

import { createConsoleLogger, type LogLevel } from './logger';

describe('createConsoleLogger', () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;
	let originalDateToISOString: () => string;
	const fixedTimestamp = '2026-01-05T12:00:00.000Z';

	beforeEach(() => {
		// DeepMock console.log to capture output
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
			/* empty */
		});

		// DeepMock Date.toISOString for consistent timestamps in tests
		originalDateToISOString = Date.prototype.toISOString;
		Date.prototype.toISOString = vi.fn(() => fixedTimestamp);
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		Date.prototype.toISOString = originalDateToISOString;
	});

	describe('log level filtering', () => {
		it('logs debug messages when level is debug', () => {
			const logger = createConsoleLogger({ level: 'debug' });

			logger.debug('test debug message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'debug',
					msg: 'test debug message'
				})
			);
		});

		it('logs info messages when level is info', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('test info message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'test info message'
				})
			);
		});

		it('logs warn messages when level is warn', () => {
			const logger = createConsoleLogger({ level: 'warn' });

			logger.warn('test warn message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'warn',
					msg: 'test warn message'
				})
			);
		});

		it('logs error messages when level is error', () => {
			const logger = createConsoleLogger({ level: 'error' });

			logger.error('test error message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'error',
					msg: 'test error message'
				})
			);
		});

		it('does not log debug when level is info', () => {
			const logger = createConsoleLogger({ level: 'info' });

			const result = logger.debug('should not appear');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		it('does not log info when level is warn', () => {
			const logger = createConsoleLogger({ level: 'warn' });

			const infoResult = logger.info('should not appear');
			const debugResult = logger.debug('should not appear');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(infoResult).toBeUndefined();
			expect(debugResult).toBeUndefined();
		});

		it('does not log warn when level is error', () => {
			const logger = createConsoleLogger({ level: 'error' });

			const warnResult = logger.warn('should not appear');
			const infoResult = logger.info('should not appear');
			const debugResult = logger.debug('should not appear');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(warnResult).toBeUndefined();
			expect(infoResult).toBeUndefined();
			expect(debugResult).toBeUndefined();
		});

		it('does not log anything when level is silent', () => {
			const logger = createConsoleLogger({ level: 'silent' });

			const errorResult = logger.error('should not appear');
			const warnResult = logger.warn('should not appear');
			const infoResult = logger.info('should not appear');
			const debugResult = logger.debug('should not appear');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(errorResult).toBeUndefined();
			expect(warnResult).toBeUndefined();
			expect(infoResult).toBeUndefined();
			expect(debugResult).toBeUndefined();
		});

		it('logs higher level messages when level is set lower', () => {
			const logger = createConsoleLogger({ level: 'debug' });

			logger.debug('debug message');
			logger.info('info message');
			logger.warn('warn message');
			logger.error('error message');

			expect(consoleLogSpy).toHaveBeenCalledTimes(4);
		});
	});

	describe('metadata handling', () => {
		it('includes metadata in log output', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message with meta', { userId: 123, action: 'login' });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message with meta',
					userId: 123,
					action: 'login'
				})
			);
		});

		it('handles undefined metadata', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message without meta');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message without meta'
				})
			);
		});

		it('includes nested metadata objects', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('complex meta', { user: { id: 1, name: 'Test' }, count: 42 });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'complex meta',
					user: { id: 1, name: 'Test' },
					count: 42
				})
			);
		});
	});

	describe('context handling', () => {
		it('includes base context in all log messages', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'test-service', version: '1.0.0' }
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

		it('merges metadata with base context', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'test-service' }
			});

			logger.info('message', { requestId: 'abc123' });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					service: 'test-service',
					requestId: 'abc123'
				})
			);
		});

		it('allows metadata to override context keys', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'test-service', env: 'dev' }
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
	});

	describe('child logger', () => {
		it('creates child logger with merged context', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'main' }
			});

			const child = logger.child({ module: 'auth' });

			child.info('child message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'child message',
					service: 'main',
					module: 'auth'
				})
			);
		});

		it('child logger inherits parent log level', () => {
			const logger = createConsoleLogger({ level: 'warn' });

			const child = logger.child({ module: 'test' });

			child.info('should not appear');
			child.warn('should appear');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'warn',
					msg: 'should appear',
					module: 'test'
				})
			);
		});

		it('child logger can be chained multiple times', () => {
			const logger = createConsoleLogger({
				level: 'info',
				context: { service: 'main' }
			});

			const child1 = logger.child({ module: 'auth' });
			const child2 = child1.child({ operation: 'login' });

			child2.info('nested child message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'nested child message',
					service: 'main',
					module: 'auth',
					operation: 'login'
				})
			);
		});

		it('child logger metadata overrides child context', () => {
			const logger = createConsoleLogger({ level: 'info' });
			const child = logger.child({ requestId: 'original' });

			child.info('message', { requestId: 'override' });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					requestId: 'override'
				})
			);
		});
	});

	describe('pretty mode', () => {
		it('formats output in pretty mode without metadata', () => {
			const logger = createConsoleLogger({ level: 'info', pretty: true });

			logger.info('test message');

			expect(consoleLogSpy).toHaveBeenCalledWith(`${fixedTimestamp} INFO test message`, '');
		});

		it('formats output in pretty mode with metadata', () => {
			const logger = createConsoleLogger({ level: 'info', pretty: true });

			logger.info('test message', { userId: 123 });

			expect(consoleLogSpy).toHaveBeenCalledWith(
				`${fixedTimestamp} INFO test message`,
				expect.objectContaining({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'test message',
					userId: 123
				})
			);
		});

		it('formats output in pretty mode with context', () => {
			const logger = createConsoleLogger({
				level: 'info',
				pretty: true,
				context: { service: 'test' }
			});

			logger.info('test message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				`${fixedTimestamp} INFO test message`,
				expect.objectContaining({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'test message',
					service: 'test'
				})
			);
		});

		it('uppercases log level in pretty mode', () => {
			const logger = createConsoleLogger({ level: 'debug', pretty: true });

			logger.debug('debug message');
			logger.info('info message');
			logger.warn('warn message');
			logger.error('error message');

			expect(consoleLogSpy).toHaveBeenNthCalledWith(1, `${fixedTimestamp} DEBUG debug message`, '');
			expect(consoleLogSpy).toHaveBeenNthCalledWith(2, `${fixedTimestamp} INFO info message`, '');
			expect(consoleLogSpy).toHaveBeenNthCalledWith(3, `${fixedTimestamp} WARN warn message`, '');
			expect(consoleLogSpy).toHaveBeenNthCalledWith(4, `${fixedTimestamp} ERROR error message`, '');
		});
	});

	describe('edge cases', () => {
		it('handles empty message string', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: ''
				})
			);
		});

		it('handles special characters in message', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message with "quotes" and \n newlines');

			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		});

		it('handles null values in metadata', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message', { value: null } as any);

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message',
					value: null
				})
			);
		});

		it('handles empty metadata object', () => {
			const logger = createConsoleLogger({ level: 'info' });

			logger.info('message', {});

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message'
				})
			);
		});

		it('handles empty context object', () => {
			const logger = createConsoleLogger({ level: 'info', context: {} });

			logger.info('message');

			expect(consoleLogSpy).toHaveBeenCalledWith(
				JSON.stringify({
					ts: fixedTimestamp,
					level: 'info',
					msg: 'message'
				})
			);
		});
	});

	describe('all log levels integration', () => {
		it('respects log level hierarchy', () => {
			const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

			levels.forEach((level, index) => {
				consoleLogSpy.mockClear();
				const logger = createConsoleLogger({ level });

				logger.debug('debug');
				logger.info('info');
				logger.warn('warn');
				logger.error('error');

				// Each level should log itself and all higher levels
				const expectedCalls = 4 - index;
				expect(consoleLogSpy).toHaveBeenCalledTimes(expectedCalls);
			});
		});
	});
});
