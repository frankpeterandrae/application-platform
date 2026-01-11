/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { Logger, LOGGER_SOURCE } from './logger.service';

describe('Logger', () => {
	let logger: Logger;

	beforeEach(async () => {
		jest.clearAllMocks();
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		jest.spyOn(console, 'info').mockImplementation(() => {});
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		jest.spyOn(console, 'error').mockImplementation(() => {});
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		jest.spyOn(console, 'debug').mockImplementation(() => {});

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
		jest.spyOn(console, 'info');
		logger.info('Info message');

		expect(console.info).toHaveBeenCalledWith('[TestSource]', 'Info message');
	});

	it('should log warning messages', () => {
		jest.spyOn(console, 'warn');
		logger.warn('Warning message');

		expect(console.warn).toHaveBeenCalledWith('[TestSource]', 'Warning message');
	});

	it('should log error messages', () => {
		jest.spyOn(console, 'error');
		logger.error('Error message');

		expect(console.error).toHaveBeenCalledWith('[TestSource]', 'Error message');
	});

	it('should log debug messages', () => {
		jest.spyOn(console, 'debug');
		logger.debug('Debug message');

		expect(console.debug).toHaveBeenCalledWith('[TestSource]', 'Debug message');
	});

	it('should not log messages if disabled', () => {
		Logger.setProductionMode({ disable: true });
		jest.spyOn(console, 'info');
		logger.info('No Info message');

		expect(console.info).not.toHaveBeenCalled();
	});

	it('should log messages without source', () => {
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({});
		logger = TestBed.inject(Logger);
		jest.spyOn(console, 'info');
		logger.info('Info message');

		expect(console.info).toHaveBeenCalledWith('Info message');
	});
});
