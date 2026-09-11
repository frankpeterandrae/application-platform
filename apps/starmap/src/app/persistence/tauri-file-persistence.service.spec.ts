/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TauriFilePersistenceService } from './tauri-file-persistence.service';

vi.mock('@tauri-apps/plugin-dialog', () => ({
	open: vi.fn(),
	save: vi.fn()
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
	readTextFile: vi.fn(),
	writeTextFile: vi.fn()
}));

describe('TauriFilePersistenceService', () => {
	let service: TauriFilePersistenceService;

	beforeEach(() => {
		vi.clearAllMocks();

		TestBed.configureTestingModule({
			providers: [TauriFilePersistenceService]
		});

		service = TestBed.inject(TauriFilePersistenceService);
	});

	it('should open and read the selected file', async () => {
		vi.mocked(open).mockResolvedValue('C:\\maps\\starmap.json');
		vi.mocked(readTextFile).mockResolvedValue('test-content');

		const result = await service.open({
			extensions: ['json']
		});

		expect(open).toHaveBeenCalledWith({
			multiple: false,
			directory: false,
			filters: [
				{
					name: 'Datei',
					extensions: ['json']
				}
			]
		});

		expect(readTextFile).toHaveBeenCalledWith('C:\\maps\\starmap.json');

		expect(result).toBe('test-content');
	});

	it('should return null when opening is cancelled', async () => {
		vi.mocked(open).mockResolvedValue(null);

		const result = await service.open({
			extensions: ['json']
		});

		expect(result).toBeNull();
		expect(readTextFile).not.toHaveBeenCalled();
	});

	it('should save content to the selected file', async () => {
		vi.mocked(save).mockResolvedValue('C:\\maps\\starmap.json');

		await service.save('test-content', {
			fileName: 'starmap.json',
			extensions: ['json']
		});

		expect(save).toHaveBeenCalledWith({
			defaultPath: 'starmap.json',
			filters: [
				{
					name: 'Datei',
					extensions: ['json']
				}
			]
		});

		expect(writeTextFile).toHaveBeenCalledWith('C:\\maps\\starmap.json', 'test-content');
	});

	it('should not write when saving is cancelled', async () => {
		vi.mocked(save).mockResolvedValue(null);

		await service.save('test-content', {
			fileName: 'starmap.json',
			extensions: ['json']
		});

		expect(writeTextFile).not.toHaveBeenCalled();
	});
});
