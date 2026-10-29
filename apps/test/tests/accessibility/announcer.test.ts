/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { Announcer } from '../../src/accessibility/announcer.js';
describe('Announcer', () => {
	it('uses one atomic polite live region', () => {
		const node = document.createElement('div');
		const announcer = new Announcer(node);
		announcer.announce('Vollständige Frage?');
		expect(node.textContent).toBe('Vollständige Frage?');
		expect(node.getAttribute('aria-live')).toBe('polite');
		expect(node.getAttribute('aria-atomic')).toBe('true');
		announcer.clear();
		expect(node.textContent).toBe('');
	});
});
