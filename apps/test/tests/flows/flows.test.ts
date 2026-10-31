/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { loadFlow } from '../../src/flows/index.js';
import { i18n } from '../../src/shared/translations/index.js';
describe('flow registry', () => {
	it('preserves startNode and existing node map', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ guided_login: { entry: { text: { welcome: 'Hallo' } } } })
		} as Response);
		await i18n.init();
		vi.restoreAllMocks();
		const flow = await loadFlow('demo');
		expect(flow.startNode).toBe('entry_node_welcome');
		expect(flow.nodes['entry_node_welcome']).toMatchObject({ id: 'entry_node_welcome', type: 'text' });
		expect((await loadFlow('short')).startNode).toBe('welcome');
	});
	it('rejects unknown flow paths', async () => {
		await expect(loadFlow('../unknown')).rejects.toThrow('Unknown flow');
	});
});
