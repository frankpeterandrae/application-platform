/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { ChatEngine } from '../../src/core/chat-engine.js';
import { DialogRunner } from '../../src/core/dialog-runner.js';
describe('DialogRunner', () => {
	it('visits question, answer and result in order', async () => {
		const engine = new ChatEngine({
			start: { type: 'question', text: 'Frage?', options: [{ value: 'Ja', next: 'end' }] },
			end: { type: 'result', text: 'Fertig', resultButtonId: 'eid' }
		});
		const assistant = vi.fn(async () => {});
		const action = vi.fn();
		const runner = new DialogRunner(engine, { assistant, choose: async () => 'end', action, delay: async () => {} }, () => 0);
		await runner.run('start', new AbortController().signal);
		expect(assistant.mock.calls.map((args) => args[0])).toEqual(['Frage?', 'Fertig']);
		expect(action).toHaveBeenCalledWith('eid');
	});
	it('detects automatic text cycles', async () => {
		const engine = new ChatEngine({ x: { type: 'text', text: 'X', next: 'x' } });
		await expect(
			new DialogRunner(
				engine,
				{ assistant: async () => {}, choose: async () => '', action: () => {}, delay: async () => {} },
				() => 0
			).run('x', new AbortController().signal)
		).rejects.toThrow('Zyklus');
	});
});
