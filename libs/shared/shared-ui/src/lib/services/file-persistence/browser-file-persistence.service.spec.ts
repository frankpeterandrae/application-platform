/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BrowserFileService } from '../browser-file/browser-file.service';

import { BrowserFilePersistenceService } from './browser-file-persistence.service';

describe('BrowserFilePersistenceService', () => {
	let service: BrowserFilePersistenceService;
	let browserFileService: BrowserFileService;

	beforeEach(() => {
		TestBed.configureTestingModule({});

		service = TestBed.inject(BrowserFilePersistenceService);
		browserFileService = TestBed.inject(BrowserFileService);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should save content using BrowserFileService', async () => {
		const saveSpy = vi.spyOn(browserFileService, 'save').mockImplementation(() => undefined);

		await service.save('content', {
			fileName: 'starmap.json',
			extensions: ['json'],
			mimeType: 'application/json;charset=utf-8'
		});

		expect(saveSpy).toHaveBeenCalledWith('content', 'starmap.json', 'application/json;charset=utf-8');
	});

	it('should use the default mime type when none is provided', async () => {
		const saveSpy = vi.spyOn(browserFileService, 'save').mockImplementation(() => undefined);

		await service.save('content', {
			fileName: 'file.txt',
			extensions: ['txt']
		});

		expect(saveSpy).toHaveBeenCalledWith('content', 'file.txt', 'text/plain;charset=utf-8');
	});

	it('should configure and open the file input', () => {
		const input = document.createElement('input');

		const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => undefined);

		vi.spyOn(document, 'createElement').mockReturnValue(input);

		void service.open({
			extensions: ['json', 'map']
		});

		expect(input.type).toBe('file');
		expect(input.accept).toBe('.json,.map');
		expect(clickSpy).toHaveBeenCalledOnce();
	});

	it('should return the selected file content', async () => {
		const input = document.createElement('input');

		vi.spyOn(input, 'click').mockImplementation(() => undefined);
		vi.spyOn(document, 'createElement').mockReturnValue(input);

		const file = new File(['test-content'], 'starmap.json', {
			type: 'application/json'
		});

		Object.defineProperty(input, 'files', {
			configurable: true,
			value: [file]
		});

		const result = service.open({
			extensions: ['json']
		});

		input.dispatchEvent(new Event('change'));

		await expect(result).resolves.toBe('test-content');
	});

	it('should return null when the file dialog is cancelled', async () => {
		const input = document.createElement('input');

		vi.spyOn(input, 'click').mockImplementation(() => undefined);
		vi.spyOn(document, 'createElement').mockReturnValue(input);

		const result = service.open({
			extensions: ['json']
		});

		input.dispatchEvent(new Event('cancel'));

		await expect(result).resolves.toBeNull();
	});
});
