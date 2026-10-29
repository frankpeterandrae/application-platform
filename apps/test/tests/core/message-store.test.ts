/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { MessageStore } from '../../src/core/message-store.js';
describe('MessageStore', () => {
	it('notifies on add/update/clear and never exposes writable state', () => {
		const store = new MessageStore();
		const onChange = vi.fn();
		store.addEventListener('change', onChange);
		const item = store.add('assistant', 'Hallo');
		expect(item.status).toBe('pending');
		store.update(item.id, { status: 'complete' });
		expect(store.messages[0]?.status).toBe('complete');
		store.messages[0]!.text = 'modified';
		expect(store.messages[0]?.text).toBe('Hallo');
		expect(onChange).toHaveBeenCalledTimes(2);
		store.clear();
		expect(store.messages).toHaveLength(0);
	});
});
