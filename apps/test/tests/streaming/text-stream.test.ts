/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { TextStream } from '../../src/streaming/text-stream.js';
describe('TextStream', () => {
	it('renders immediately when speed is zero', async () => {
		let visible = '';
		await new TextStream().reveal('Hallo 👋', 0, new AbortController().signal, (text) => {
			visible = text;
		});
		expect(visible).toBe('Hallo 👋');
	});
	it('can be skipped without truncating the final string', async () => {
		const stream = new TextStream();
		let visible = '';
		await stream.reveal('Ä👨‍👩‍👧‍👦abc', 100, new AbortController().signal, (text) => {
			visible = text;
			stream.skip();
		});
		expect(visible).toBe('Ä👨‍👩‍👧‍👦abc');
	});
	it('rejects already aborted streams', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(new TextStream().reveal('A', 0, controller.signal, () => {})).rejects.toMatchObject({ name: 'AbortError' });
	});
});
