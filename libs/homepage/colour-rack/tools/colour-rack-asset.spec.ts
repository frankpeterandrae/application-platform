/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';

import { ColourRackAsset } from './colour-rack-asset';

const paint = {
	id: 'two-thin-coats:001',
	brand_id: 'two-thin-coats',
	sku: '001',
	name: 'Steel Shadow',
	category: 'S-ME',
	main_color: '#134ABC',
	secondary_color: '#123456',
	range: '4',
	barcode: '0123456789012'
};
const other = { ...paint, id: 'two-thin-coats:Verd', sku: 'Verd', secondary_color: null, range: null, barcode: null };

describe('ColourRackAsset.build', () => {
	it('maps paint and match fields while preserving layout and string identifiers', () => {
		const matches = [
			{ paint_id: paint.id, name: 'Basilisk (AP)' },
			{ paint_id: paint.id, name: 'Zinc (GW)' },
			{ paint_id: paint.id, name: 'Alloy (VGC)' },
			{ paint_id: paint.id, name: 'steel (GW)' },
			{ paint_id: paint.id, name: 'Alloy (VGC)' },
			{ paint_id: paint.id, name: 'Iron (VMC)' }
		];
		const layout = ['Verd', '001'];
		const result = ColourRackAsset.build([paint, other], matches, layout);
		expect(result).toEqual([
			{ name: 'Steel Shadow', sku: 'Verd', type: 'S-ME', mainColor: '#134ABC', alternativeNames: [] },
			{
				name: 'Steel Shadow',
				sku: '001',
				type: 'S-ME',
				mainColor: '#134ABC',
				secondaryColor: '#123456',
				wave: '4',
				barcode: '0123456789012',
				alternativeNames: ['steel (GW)', 'Zinc (GW)', 'Alloy (VGC)', 'Basilisk (AP)', 'Iron (VMC)']
			}
		]);
		expect(JSON.stringify(ColourRackAsset.build([other, paint], matches.reverse(), layout))).toBe(JSON.stringify(result));
	});

	it('exports only paints placed in the rack', () => {
		const colors = ColourRackAsset.build([paint, other], [{ paint_id: 'citadel:123', name: 'Gold' }], ['001']);
		expect(colors.map(({ sku }) => sku)).toEqual(['001']);
	});

	it.each([
		[{ name: undefined }, /two-thin-coats:001.*name/],
		[{ category: 'base' }, /two-thin-coats:001.*unsupported category/],
		[{ main_color: 'red' }, /two-thin-coats:001.*main_color/],
		[{ secondary_color: '#12345' }, /two-thin-coats:001.*secondary_color/],
		[{ barcode: 123 }, /two-thin-coats:001.*barcode/]
	])('rejects invalid paint fields (%j)', (fields, error) => {
		expect(() => ColourRackAsset.build([{ ...paint, ...fields }], [], ['001'])).toThrow(error);
	});

	it('rejects unknown and duplicate SKUs and orphan matches', () => {
		expect(() => ColourRackAsset.build([paint], [], ['002'])).toThrow(/rack-layout.json.*unknown paint two-thin-coats:002/);
		expect(() => ColourRackAsset.build([paint], [], ['001', '001'])).toThrow(/rack-layout.json.*duplicate paint two-thin-coats:001/);
		expect(() => ColourRackAsset.build([paint, paint], [], ['001'])).toThrow(/two-thin-coats:001.*duplicate paint SKU/);
		expect(() => ColourRackAsset.build([paint], [{ paint_id: other.id, name: 'Green' }], ['001'])).toThrow(
			/paint_match.json.*unknown paint two-thin-coats:Verd/
		);
	});

	it('reports malformed snapshot structures and mismatched paint identifiers', () => {
		expect(() => ColourRackAsset.build([], {}, [])).toThrow(new TypeError('paint_match.json: expected a JSON array'));
		expect(() => ColourRackAsset.build([null], [], [])).toThrow(new TypeError('two-thin-coats.json[0]: expected an object'));
		expect(() => ColourRackAsset.build([{ ...paint, id: other.id }], [], ['001'])).toThrow(
			/two-thin-coats:001.*expected matching brand_id and id/
		);
	});
});
