/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { definePaints } from './define-paints';

describe('definePaints', () => {
	it('returns paints keyed by SKU with id, brand, and sku fields', () => {
		const paints = definePaints('citadel', {
			A1: { name: 'Red', mainColor: '#ff0000', colorGroups: [] },
			B2: { name: 'Blue', mainColor: '#0000ff', colorGroups: [] }
		});

		expect(paints).toEqual({
			A1: { name: 'Red', mainColor: '#ff0000', id: 'citadel:A1', brand: 'citadel', sku: 'A1', colorGroups: [] },
			B2: { name: 'Blue', mainColor: '#0000ff', id: 'citadel:B2', brand: 'citadel', sku: 'B2', colorGroups: [] }
		});
	});

	it('preserves source definition properties on each paint', () => {
		const paints = definePaints('army-painter', {
			C3: { name: 'Green', mainColor: '#00ff00', colorGroups: [] }
		});

		expect(paints['C3']).toMatchObject({
			name: 'Green',
			mainColor: '#00ff00',
			colorGroups: [],
			id: 'army-painter:C3',
			brand: 'army-painter',
			sku: 'C3'
		});
	});

	it('returns an empty collection when no definitions are provided', () => {
		const paints = definePaints('two-thin-coats', {});

		expect(paints).toEqual({});
	});

	it('uses the definition key as sku even when it contains separators', () => {
		const paints = definePaints('vallejo-game-color', {
			'X-10_2': { name: 'Special', mainColor: '#123456', colorGroups: [] }
		});

		expect(paints['X-10_2']).toEqual({
			name: 'Special',
			mainColor: '#123456',
			colorGroups: [],
			id: 'vallejo-game-color:X-10_2',
			brand: 'vallejo-game-color',
			sku: 'X-10_2'
		});
	});

	it('prefers generated id, brand, and sku over conflicting values in source definitions', () => {
		const paints = definePaints('citadel', {
			Z9: {
				name: 'Override Check',
				mainColor: '#abcdef',
				id: 'wrong:id',
				brand: 'wrongBrand',
				sku: 'wrongSku'
			} as any
		});

		expect(paints['Z9'].id).toBe('citadel:Z9');
		expect(paints['Z9'].brand).toBe('citadel');
		expect(paints['Z9'].sku).toBe('Z9');
	});
});
