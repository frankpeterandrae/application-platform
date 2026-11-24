/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import { App } from './app/app';
import { appConfig } from './app/app.config';

vi.mock('@angular/platform-browser', async (importOriginal) => ({
	...(await importOriginal<typeof import('@angular/platform-browser')>()),
	bootstrapApplication: vi.fn()
}));

describe('Stream Overlay UI entry point', () => {
	it('starts the root component with the configured application providers', async () => {
		await import('./main');

		expect(bootstrapApplication).toHaveBeenCalledExactlyOnceWith(App, appConfig);
	});
});
