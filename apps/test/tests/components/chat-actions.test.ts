/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { ChatActionsElement } from '../../src/components/chat-actions.js';
describe('ChatActionsElement', () => {
	it('emits the selected option and disables buttons', () => {
		const actions = new ChatActionsElement();
		const selected = vi.fn();
		actions.addEventListener('choice', selected);
		actions.setChoices([{ value: 'Ja', next: 'next' }]);
		actions.shadowRoot?.querySelector('button')?.click();
		expect(selected).toHaveBeenCalledOnce();
		expect(selected.mock.calls[0]?.[0].detail.next).toBe('next');
		actions.disable();
		expect(actions.shadowRoot?.querySelector('button')?.disabled).toBe(true);
	});
});
