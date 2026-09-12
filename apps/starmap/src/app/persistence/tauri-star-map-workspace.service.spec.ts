/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TauriStarMapWorkspaceService } from './tauri-star-map-workspace.service';

vi.mock('@tauri-apps/api/core', () => ({
	invoke: vi.fn()
}));

describe('TauriStarMapWorkspaceService', () => {
	let service: TauriStarMapWorkspaceService;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [TauriStarMapWorkspaceService, provideHttpClient(), provideHttpClientTesting()]
		});

		service = TestBed.inject(TauriStarMapWorkspaceService);
		httpTesting = TestBed.inject(HttpTestingController);

		vi.clearAllMocks();
	});

	it('should load the workspace file when it exists', async () => {
		vi.mocked(invoke).mockResolvedValue('workspace-content');

		const content = await service.load();

		expect(invoke).toHaveBeenCalledWith('load_starmap_workspace');
		expect(content).toBe('workspace-content');

		httpTesting.expectNone('/assets/maps/starmap.json');
	});

	it('should load the default asset when no workspace file exists', async () => {
		vi.mocked(invoke).mockResolvedValue(null);

		const result = service.load();

		await vi.waitFor(() => {
			expect(invoke).toHaveBeenCalledWith('load_starmap_workspace');
		});

		const request = httpTesting.expectOne('/assets/maps/starmap.json');

		request.flush('default-content');

		await expect(result).resolves.toBe('default-content');
	});

	it('should save the workspace through Tauri', async () => {
		vi.mocked(invoke).mockResolvedValue(undefined);

		await service.save('workspace-content');

		expect(invoke).toHaveBeenCalledWith('save_starmap_workspace', {
			content: 'workspace-content'
		});
	});
});
