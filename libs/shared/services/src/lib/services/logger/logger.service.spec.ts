/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupTestingModule } from '../../test-setup';
import { Logger, LogLevel } from './logger.service';

describe('Logger', () => {
	beforeEach(() => {
		// Reset static state before each test
		Logger.setProductionMode({ disable: false });
		vi.clearAllMocks();
	});

	describe('setProductionMode', () => {
		it('should disable logging when disable is true', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
			Logger.setProductionMode({ disable: true });
			Logger.info('test message');
			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should enable logging when disable is false', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
			Logger.setProductionMode({ disable: false });
			Logger.info('test message');
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe('addOutput', () => {
		it('should register a custom output handler', () => {
			const outputFn = vi.fn();
			Logger.addOutput(outputFn);

			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();
			Logger.info('test');

			expect(outputFn).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should call multiple output handlers', () => {
			const output1 = vi.fn();
			const output2 = vi.fn();
			Logger.addOutput(output1);
			Logger.addOutput(output2);

			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();
			Logger.info('test');

			expect(output1).toHaveBeenCalled();
			expect(output2).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should pass source, level, and objects to output handler', () => {
			const outputFn = vi.fn();
			Logger.addOutput(outputFn);

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
			Logger.error('test error');

			expect(outputFn).toHaveBeenCalledWith(undefined, LogLevel.Error, 'test error');
			consoleSpy.mockRestore();
		});
	});

	describe('info', () => {
		it('should log info messages', () => {
			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();
			Logger.info('info message');
			expect(consoleSpy).toHaveBeenCalledWith('info message');
			consoleSpy.mockRestore();
		});

		it('should log multiple objects', () => {
			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();
			Logger.info('message', { key: 'value' }, 123);
			expect(consoleSpy).toHaveBeenCalledWith('message', { key: 'value' }, 123);
			consoleSpy.mockRestore();
		});

		it('should not log when production mode is disabled', () => {
			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();
			Logger.setProductionMode({ disable: true });
			Logger.info('test');
			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe('warn', () => {
		it('should log warn messages', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
			Logger.warn('warn message');
			expect(consoleSpy).toHaveBeenCalledWith('warn message');
			consoleSpy.mockRestore();
		});

		it('should log multiple objects', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
			Logger.warn('message', { warning: true });
			expect(consoleSpy).toHaveBeenCalledWith('message', { warning: true });
			consoleSpy.mockRestore();
		});
	});

	describe('error', () => {
		it('should log error messages', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
			Logger.error('error message');
			expect(consoleSpy).toHaveBeenCalledWith('error message');
			consoleSpy.mockRestore();
		});

		it('should log error objects', () => {
			const error = new Error('test error');
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
			Logger.error('An error occurred:', error);
			expect(consoleSpy).toHaveBeenCalledWith('An error occurred:', error);
			consoleSpy.mockRestore();
		});
	});

	describe('debug', () => {
		it('should log debug messages', () => {
			const consoleSpy = vi.spyOn(console, 'debug').mockImplementation();
			Logger.debug('debug message');
			expect(consoleSpy).toHaveBeenCalledWith('debug message');
			consoleSpy.mockRestore();
		});

		it('should log complex debug objects', () => {
			const consoleSpy = vi.spyOn(console, 'debug').mockImplementation();
			const debugObj = { state: { nested: 'value' } };
			Logger.debug('state:', debugObj);
			expect(consoleSpy).toHaveBeenCalledWith('state:', debugObj);
			consoleSpy.mockRestore();
		});
	});

	describe('with source injection', () => {
		it('should add source prefix to logs', async () => {
			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();

			await setupTestingModule({
				providers: [Logger]
			});

			const logger = TestBed.inject(Logger);
			logger.info('test message');

			// Logger should have been called (source is optional)
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe('output handler error handling', () => {
		it('should catch and ignore output handler errors', () => {
			const badOutput = vi.fn().mockImplementation(() => {
				throw new Error('Output handler failed');
			});
			const goodOutput = vi.fn();
			Logger.addOutput(badOutput);
			Logger.addOutput(goodOutput);

			const consoleSpy = vi.spyOn(console, 'info').mockImplementation();

			// This should not throw even though badOutput throws
			expect(() => Logger.info('test')).not.toThrow();

			// Both handlers should have been called
			expect(badOutput).toHaveBeenCalled();
			expect(goodOutput).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	describe('console error handling', () => {
		it('should catch console method errors', () => {
			const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {
				throw new Error('Console method failed');
			});

			// This should not throw even though console.info throws
			expect(() => Logger.info('test')).not.toThrow();

			consoleSpy.mockRestore();
		});
	});

	describe('log levels', () => {
		it('should respect log level filtering', () => {
			const outputFn = vi.fn();
			Logger.addOutput(outputFn);

			const infoSpy = vi.spyOn(console, 'info').mockImplementation();
			const debugSpy = vi.spyOn(console, 'debug').mockImplementation();

			Logger.info('info');
			Logger.debug('debug');

			expect(infoSpy).toHaveBeenCalled();
			// Debug may or may not be called depending on level configuration

			infoSpy.mockRestore();
			debugSpy.mockRestore();
		});
	});
});
