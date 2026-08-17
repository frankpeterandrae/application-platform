/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { definePaintMatches } from './define-paint-matches';

describe('definePaintMatches', () => {
	it('returns the provided paint matches', () => {
		const matches = definePaintMatches([
			[{ id: 'citadel:A1' }, { id: 'army-painter:B2' }],
			[{ id: 'two-thin-coats:C3' }, { id: 'vallejo-game-color:D4' }]
		]);

		expect(matches).toEqual([
			[{ id: 'citadel:A1' }, { id: 'army-painter:B2' }],
			[{ id: 'two-thin-coats:C3' }, { id: 'vallejo-game-color:D4' }]
		]);
	});

	it('supports secondary paint references in a match', () => {
		const matches = definePaintMatches([
			[{ id: 'citadel:X1' }, { id: 'army-painter:Y1' }, { id: 'two-thin-coats:Z1' }, { id: 'vallejo-game-color:W1' }]
		]);

		expect(matches[0]).toEqual([
			{ id: 'citadel:X1' },
			{ id: 'army-painter:Y1' },
			{ id: 'two-thin-coats:Z1' },
			{ id: 'vallejo-game-color:W1' }
		]);
	});

	it('returns an empty array when no paint matches are provided', () => {
		const matches = definePaintMatches([]);

		expect(matches).toEqual([]);
	});

	it('keeps paint ids exactly as provided', () => {
		const matches = definePaintMatches([[{ id: 'citadel:SKU_10-XL' }, { id: 'army-painter:Q2' }]]);

		expect(matches[0][0].id).toBe('citadel:SKU_10-XL');
		expect(matches[0][1].id).toBe('army-painter:Q2');
	});
});
