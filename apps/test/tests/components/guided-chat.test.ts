/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { GuidedChat } from '../../src/components/guided-chat.js';
describe('GuidedChat', () => {
	it('renders complete question, selection and result without Carbon', async () => {
		const chat = new GuidedChat();
		chat.configure({ charactersPerSecond: 0, nextDelayMs: 0 });
		document.body.append(chat);
		chat.nodes = {
			entry_node_welcome: { type: 'question', text: 'PIN vorhanden?', options: [{ value: 'Ja', next: 'done' }] },
			done: { type: 'text', text: 'Weiter geht es.' }
		};
		await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('chat-actions button')).toBeNull()); // shadow encapsulation
		await vi.waitFor(() => expect(chat.shadowRoot?.querySelector('chat-actions')?.shadowRoot?.querySelector('button')).toBeTruthy());
		const live = chat.shadowRoot?.querySelector('[aria-live="polite"]');
		expect(live?.textContent).toBe('PIN vorhanden?');
		chat.shadowRoot?.querySelector('chat-actions')?.shadowRoot?.querySelector('button')?.click();
		await vi.waitFor(() => expect(chat.messages.some((message) => message.text === 'Weiter geht es.')).toBe(true));
		expect(chat.messages.some((message) => message.role === 'user' && message.text === 'Ja')).toBe(true);
		chat.remove();
	});
});
