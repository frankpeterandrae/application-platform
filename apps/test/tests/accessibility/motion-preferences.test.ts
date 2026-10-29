/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';
import { effectiveCharactersPerSecond } from '../../src/accessibility/motion-preferences.js';
describe('motion preferences', () => {
	it('disables animated text with reduced motion', () => {
		vi.stubGlobal('matchMedia', () => ({ matches: true }));
		expect(effectiveCharactersPerSecond(42, true)).toBe(0);
		expect(effectiveCharactersPerSecond(42, false)).toBe(42);
		vi.unstubAllGlobals();
	});
});
