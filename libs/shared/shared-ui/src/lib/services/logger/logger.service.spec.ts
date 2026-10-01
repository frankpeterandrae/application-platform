/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { Logger, LOGGER_SOURCE, LogLevel } from './logger.service';

describe('Logger', () => {
	let logger: Logger;

	beforeEach(async () => {
		vi.clearAllMocks();

		vi.spyOn(console, 'info').mockImplementation(() => undefined);

		vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		vi.spyOn(console, 'error').mockImplementation(() => undefined);

		vi.spyOn(console, 'debug').mockImplementation(() => undefined);

		await setupTestingModule({
			providers: [{ provide: LOGGER_SOURCE, useValue: 'TestSource' }]
		});
		logger = TestBed.inject(Logger);

		Logger.setProductionMode({ disable: false });
	});

	it('should log info messages', () => {
		logger.info('Info message');

		expect(console.info).toHaveBeenCalledWith('[TestSource]', 'Info message');
	});

	it('should log warning messages', () => {
		logger.warn('Warning message');

		expect(console.warn).toHaveBeenCalledWith('[TestSource]', 'Warning message');
	});

	it('should log error messages', () => {
		logger.error('Error message');

		expect(console.error).toHaveBeenCalledWith('[TestSource]', 'Error message');
	});

	it('should log debug messages', () => {
		logger.debug('Debug message');

		expect(console.debug).toHaveBeenCalledWith('[TestSource]', 'Debug message');
	});

	it('should forward messages to registered output handlers', () => {
		const output = vi.fn();
		const removeOutput = Logger.addOutput(output);

		logger.warn('Warning message');

		expect(output).toHaveBeenCalledWith('TestSource', LogLevel.Warn, 'Warning message');

		removeOutput();
	});

	it('should not log messages if disabled', () => {
		Logger.setProductionMode({ disable: true });
		vi.spyOn(console, 'info');
		logger.info('No Info message');

		expect(console.info).not.toHaveBeenCalled();
		expect(console.warn).not.toHaveBeenCalled();
		expect(console.error).not.toHaveBeenCalled();
		expect(console.debug).not.toHaveBeenCalled();
	});

	it('should log messages without source', async () => {
		TestBed.resetTestingModule();
		await setupTestingModule({});
		logger = TestBed.inject(Logger);
		vi.spyOn(console, 'info');
		logger.info('Info message');

		expect(console.info).toHaveBeenCalledWith('Info message');
	});

	it('should ignore errors thrown by custom output handlers', () => {
		Logger.addOutput(() => {
			throw new Error('output failed');
		});

		expect(() => logger.info('Info message')).not.toThrow();

		expect(console.info).toHaveBeenCalledWith('[TestSource]', 'Info message');
	});

	it('should ignore errors thrown by console output', () => {
		vi.mocked(console.info).mockImplementation(() => {
			throw new Error('console failed');
		});

		expect(() => logger.info('Info message')).not.toThrow();
	});

	it('should unregister an output handler', () => {
		const output = vi.fn();
		const removeOutput = Logger.addOutput(output);

		removeOutput();
		logger.info('Info message');

		expect(output).not.toHaveBeenCalled();
	});
});
