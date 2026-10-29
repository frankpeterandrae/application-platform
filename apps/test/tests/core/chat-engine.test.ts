/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { ChatEngine } from '../../src/core/chat-engine.js';
describe('ChatEngine', () => {
	it('looks up sync and async sources', async () => {
		const engine = new ChatEngine({ a: { type: 'text', text: 'A' } });
		expect((await engine.lookup('a')).text).toBe('A');
		engine.source = async () => ({ type: 'result', text: 'B', resultButtonId: 'eid' });
		expect((await engine.lookup('a')).text).toBe('B');
	});
	it('rejects unknown nodes and reserved registrations', async () => {
		const engine = new ChatEngine({});
		await expect(engine.lookup('missing')).rejects.toThrow('Dialogknoten fehlt');
		expect(() => engine.register('question', async () => {})).toThrow();
		const unregister = engine.register('custom', async () => {});
		expect(engine.handler('custom')).toBeDefined();
		unregister();
		expect(engine.handler('custom')).toBeUndefined();
	});
});
