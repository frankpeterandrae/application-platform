/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/*
 * Minimal test to cover turnout-info-event exports
 */
import { describe, expect, it } from 'vitest';

import { TurnoutState } from './turnout-info-event';

describe('turnout-info-event exports', () => {
	it('exports TurnoutState constants', () => {
		expect(TurnoutState.STRAIGHT).toBe('STRAIGHT');
		expect(TurnoutState.DIVERGING).toBe('DIVERGING');
		expect(TurnoutState.UNKNOWN).toBe('UNKNOWN');
	});
});
