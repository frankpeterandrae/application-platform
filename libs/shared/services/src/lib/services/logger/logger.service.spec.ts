/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { Logger, LOGGER_SOURCE } from './logger.service';

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

	it('should be created', () => {
		expect(logger).toBeTruthy();
	});

	it('should log info messages', () => {
		vi.spyOn(console, 'info');
		logger.info('Info message');

		expect(console.info).toHaveBeenCalledWith('[TestSource]', 'Info message');
	});

	it('should log warning messages', () => {
		vi.spyOn(console, 'warn');
		logger.warn('Warning message');

		expect(console.warn).toHaveBeenCalledWith('[TestSource]', 'Warning message');
	});

	it('should log error messages', () => {
		vi.spyOn(console, 'error');
		logger.error('Error message');

		expect(console.error).toHaveBeenCalledWith('[TestSource]', 'Error message');
	});

	it('should log debug messages', () => {
		vi.spyOn(console, 'debug');
		logger.debug('Debug message');

		expect(console.debug).toHaveBeenCalledWith('[TestSource]', 'Debug message');
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

	it('should log messages without source', () => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({});
		logger = TestBed.inject(Logger);
		vi.spyOn(console, 'info');
		logger.info('Info message');

		expect(console.info).toHaveBeenCalledWith('Info message');
	});
});
