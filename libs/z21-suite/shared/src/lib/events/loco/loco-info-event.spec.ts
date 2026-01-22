/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/*
 * Minimal test to cover loco-info-event exports
 */
import { describe, expect, it } from 'vitest';

import { Direction } from './loco-info-event';

describe('loco-info-event exports', () => {
	it('exports Direction constants', () => {
		expect(Direction.FWD).toBe('FWD');
		expect(Direction.REV).toBe('REV');
	});
});
