/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { plainText, safeFragment } from '../src/content.js';
describe('content sanitizer', () => {
	it('does not retain scripts or javascript URLs', () => {
		const node = document.createElement('div');
		node.append(safeFragment('<a href="javascript:alert(1)">Klick</a><script>evil()</script>'));
		expect(node.querySelector('a')).toBeNull();
		expect(node.querySelector('script')).toBeNull();
		expect(plainText('<strong>Hallo</strong>')).toBe('Hallo');
	});
});
