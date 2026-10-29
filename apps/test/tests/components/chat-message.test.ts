/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { ChatMessageElement } from '../../src/components/chat-message.js';
describe('ChatMessageElement', () => {
	it('hides animated visuals from assistive technology and preserves safe text', () => {
		const message = new ChatMessageElement();
		message.setVisualText('Hal');
		expect(message.shadowRoot?.querySelector('[aria-hidden="true"]')?.textContent).toBe('Hal');
		message.setAccessibleText('Hallo');
		message.complete('<strong>Hallo</strong><script>alert(1)</script>');
		expect(message.shadowRoot?.querySelector('strong')?.textContent).toBe('Hallo');
		expect(message.shadowRoot?.textContent).toContain('Hallo');
		expect(message.shadowRoot?.querySelector('script')).toBeNull();
	});
});
