/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintBrandDefinition } from '@application-platform/paint';

import { PaintSelector } from './paint-selector';

const brands: PaintBrandDefinition[] = [
	{
		id: 'citadel',
		label: 'Citadel'
	},
	{
		id: 'army-painter',
		label: 'Army Painter'
	}
];

const paints: Paint[] = [
	{
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		range: 'Base',
		category: 'Acrylic',
		mainColor: '#991115',
		colorGroups: ['red']
	},
	{
		id: 'citadel:22-01',
		brand: 'citadel',
		sku: '22-01',
		name: 'Khorne Red',
		range: 'Base',
		category: 'Acrylic',
		mainColor: '#650001',
		colorGroups: ['red', 'brown']
	},
	{
		id: 'citadel:23-01',
		brand: 'citadel',
		sku: '23-01',
		name: 'Evil Sunz Scarlet',
		range: 'Layer',
		category: 'Acrylic',
		mainColor: '#c21920',
		colorGroups: ['red']
	},
	{
		id: 'citadel:24-01',
		brand: 'citadel',
		sku: '24-01',
		name: 'Leadbelcher',
		range: 'Base',
		category: 'Metallic',
		mainColor: '#777777',
		colorGroups: ['black-to-white', 'metallic']
	},
	{
		id: 'citadel:25-01',
		brand: 'citadel',
		sku: '25-01',
		name: 'Unassigned Paint',
		range: 'Layer',
		category: 'Acrylic',
		mainColor: '#123456',
		colorGroups: []
	}
];

describe('PaintSelector', () => {
	it('should provide 32 slots', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		expect(selector.slots).toHaveLength(32);
	});

	it('should show recent paints in the first row', () => {
		const selector = new PaintSelector({
			paints,
			brands,
			recentPaintIds: ['citadel:21-03']
		});

		expect(selector.slots[0].button.type).toBe('paint');

		expect(selector.slots[0].button).toMatchObject({
			label: 'Mephiston Red'
		});
	});

	it('should show brands starting at slot 8', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		expect(selector.slots[8].button).toMatchObject({
			type: 'brand',
			label: 'Citadel'
		});
	});

	it('should show filters when opening a brand', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8);

		expect(selector.slots[0].button).toMatchObject({
			type: 'color',
			label: 'Rot'
		});

		expect(selector.slots[16].button).toMatchObject({
			type: 'category',
			label: 'Acrylic'
		});
	});

	it('should return the selected paint and return home', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8); // Citadel
		selector.press(16); // Base

		const action = selector.press(0);

		expect(action).toEqual({
			type: 'paint-selected',
			paint: paints[0]
		});

		expect(selector.slots[8].button.type).toBe('brand');
	});

	it('should expose the external home action', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		expect(selector.press(24)).toEqual({
			type: 'home'
		});
	});

	it('should return from paint selection to the brand filters', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8); // Citadel
		selector.press(0); // Rot

		expect(selector.slots[0].button.type).toBe('paint');

		selector.press(25); // Back

		expect(selector.slots[0].button).toMatchObject({
			type: 'color',
			label: 'Rot'
		});

		expect(selector.slots[1].button).toMatchObject({
			type: 'color',
			label: 'Braun'
		});
	});

	it('should return to brand selection when pressing home from brand filters', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8); // Citadel

		const action = selector.press(24); // Home

		expect(action).toEqual({
			type: 'none'
		});

		expect(selector.slots[8].button).toMatchObject({
			type: 'brand',
			label: 'Citadel'
		});
	});

	it('should return to brand selection when pressing home from paint selection', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8); // Citadel
		selector.press(8); // Base

		const action = selector.press(24); // Home

		expect(action).toEqual({
			type: 'none'
		});

		expect(selector.slots[8].button).toMatchObject({
			type: 'brand',
			label: 'Citadel'
		});
	});

	it('should only show color groups used by paints of the selected brand', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8);

		expect(selector.slots[0].button).toMatchObject({
			type: 'color',
			label: 'Rot',
			value: 'red'
		});

		expect(selector.slots[1].button).toMatchObject({
			type: 'color',
			label: 'Braun',
			value: 'brown'
		});

		expect(selector.slots[2].button).toMatchObject({
			type: 'color',
			label: 'Schwarz–Weiß',
			value: 'black-to-white'
		});

		expect(selector.slots[3].button).toMatchObject({
			type: 'color',
			label: 'Metallic',
			value: 'metallic'
		});

		expect(selector.slots[4].button.type).toBe('empty');
	});

	it('should filter paints by color group', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8);

		// Rot
		selector.press(0);

		expect(selector.slots[0].button).toMatchObject({
			type: 'paint',
			label: 'Mephiston Red'
		});

		expect(selector.slots[1].button).toMatchObject({
			type: 'paint',
			label: 'Khorne Red'
		});

		expect(selector.slots[2].button).toMatchObject({
			type: 'paint',
			label: 'Evil Sunz Scarlet'
		});

		expect(selector.slots[3].button.type).toBe('empty');
	});

	it('should expose a paint in each of its color groups', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8);

		// Braun
		selector.press(1);

		expect(selector.slots[0].button).toMatchObject({
			type: 'paint',
			label: 'Khorne Red'
		});

		selector.press(25);

		// Rot
		selector.press(0);

		expect(
			selector.slots
				.filter((slot) => slot.button.type === 'paint')
				.some((slot) => slot.button.type === 'paint' && slot.button.label === 'Khorne Red')
		).toBe(true);
	});

	it('should not expose paints without color groups through a color filter', () => {
		const selector = new PaintSelector({
			paints,
			brands
		});

		selector.press(8);
		selector.press(0);

		const labels = selector.slots
			.filter((slot) => slot.button.type === 'paint')
			.map((slot) => (slot.button.type === 'paint' ? slot.button.label : undefined));

		expect(labels).not.toContain('Unassigned Paint');
	});

	describe('updates', () => {
		it('should update paints', () => {
			const selector = new PaintSelector({
				paints: [],
				brands
			});

			selector.updatePaints(paints);

			selector.press(8); // Citadel
			selector.press(16); // Base

			expect(selector.slots[0].button).toMatchObject({
				type: 'paint',
				label: 'Mephiston Red'
			});
		});

		it('should update brands', () => {
			const selector = new PaintSelector({
				paints,
				brands: []
			});

			selector.updateBrands(brands);

			expect(selector.slots[8].button).toMatchObject({
				type: 'brand',
				label: 'Citadel'
			});
		});

		it('should update recent paints and limit them to eight', () => {
			const recentPaints = Array.from({ length: 10 }, (_, index): Paint => ({
				id: `citadel:${index}`,
				brand: 'citadel',
				sku: `${index}`,
				name: `Paint ${index}`,
				mainColor: '#000000',
				colorGroups: ['red']
			}));

			const selector = new PaintSelector({
				paints: recentPaints,
				brands
			});

			selector.updateRecentPaints(recentPaints.map((paint) => paint.id));

			const recentSlots = selector.slots.slice(0, 8);

			expect(recentSlots.every((slot) => slot.button.type === 'paint')).toBe(true);

			expect(selector.slots.slice(0, 8).map((slot) => (slot.button.type === 'paint' ? slot.button.paint.id : undefined))).toEqual(
				recentPaints.slice(0, 8).map((paint) => paint.id)
			);
		});
	});

	describe('navigation', () => {
		it('should ignore an invalid slot index', () => {
			const selector = new PaintSelector({
				paints,
				brands
			});

			expect(selector.press(99)).toEqual({
				type: 'none'
			});
		});

		it('should return none when pressing an empty slot', () => {
			const selector = new PaintSelector({
				paints,
				brands
			});

			expect(selector.press(0)).toEqual({
				type: 'none'
			});
		});

		it('should show next when more than 16 brands exist on home', () => {
			const manyBrands: PaintBrandDefinition[] = Array.from({ length: 17 }, (_, index) => ({
				id: `brand-${index}`,
				label: `Brand ${index}`
			}));

			const selector = new PaintSelector({
				paints: [],
				brands: manyBrands
			});

			expect(selector.slots[31].button).toMatchObject({
				type: 'next',
				label: 'Weiter'
			});
		});

		it('should navigate to the next brand page', () => {
			const manyBrands: PaintBrandDefinition[] = Array.from({ length: 20 }, (_, index) => ({
				id: `brand-${index}`,
				label: `Brand ${index}`
			}));

			const selector = new PaintSelector({
				paints: [],
				brands: manyBrands
			});

			selector.press(31);

			expect(selector.slots[0].button).toMatchObject({
				type: 'brand',
				label: 'Brand 16'
			});

			expect(selector.slots[25].button).toMatchObject({
				type: 'back',
				label: 'Zurück'
			});
		});

		it('should navigate back to the first home page', () => {
			const manyBrands: PaintBrandDefinition[] = Array.from({ length: 20 }, (_, index) => ({
				id: `brand-${index}`,
				label: `Brand ${index}`
			}));

			const selector = new PaintSelector({
				paints: [],
				brands: manyBrands
			});

			selector.press(31);
			selector.press(25);

			expect(selector.slots[8].button).toMatchObject({
				type: 'brand',
				label: 'Brand 0'
			});
		});

		it('should not show next on the last home page', () => {
			const manyBrands: PaintBrandDefinition[] = Array.from({ length: 20 }, (_, index) => ({
				id: `brand-${index}`,
				label: `Brand ${index}`
			}));

			const selector = new PaintSelector({
				paints: [],
				brands: manyBrands
			});

			selector.press(31);

			expect(selector.slots[31].button.type).toBe('empty');
		});
	});

	it('should paginate paint results', () => {
		const manyPaints: Paint[] = Array.from({ length: 25 }, (_, index) => ({
			id: `citadel:${index}`,
			brand: 'citadel',
			sku: `${index}`,
			name: `Paint ${index}`,
			mainColor: '#000000',
			colorGroups: ['red']
		}));

		const selector = new PaintSelector({
			paints: manyPaints,
			brands
		});

		selector.press(8); // Citadel
		selector.press(0); // Rot

		expect(selector.slots[31].button.type).toBe('next');

		selector.press(31);

		expect(selector.slots[0].button).toMatchObject({
			type: 'paint',
			label: 'Paint 24'
		});

		expect(selector.slots[1].button.type).toBe('empty');
		expect(selector.slots[25].button.type).toBe('back');
		expect(selector.slots[31].button.type).toBe('empty');
	});

	describe('recent paints', () => {
		it('should ignore recent ids that no longer exist', () => {
			const selector = new PaintSelector({
				paints,
				brands,
				recentPaintIds: ['citadel:missing', 'citadel:21-03']
			});

			expect(selector.slots[0].button).toMatchObject({
				type: 'paint',
				label: 'Mephiston Red'
			});

			expect(selector.slots[1].button.type).toBe('empty');
		});
	});

	describe('filters', () => {
		it('should filter paints by category', () => {
			const selector = new PaintSelector({
				paints,
				brands
			});

			selector.press(8); // Citadel

			// Acrylic
			selector.press(16);

			expect(
				selector.slots
					.filter((slot) => slot.button.type === 'paint')
					.every((slot) => slot.button.type === 'paint' && slot.button.paint.category === 'Acrylic')
			).toBe(true);
		});

		it('should ignore undefined ranges and categories', () => {
			const selector = new PaintSelector({
				paints: [
					{
						id: 'citadel:test',
						brand: 'citadel',
						sku: 'test',
						name: 'Test',
						mainColor: '#000000',
						colorGroups: []
					}
				],
				brands
			});

			selector.press(8);

			expect(selector.slots[8].button.type).toBe('empty');
			expect(selector.slots[16].button.type).toBe('empty');
		});
	});

	describe('brand navigation', () => {
		it('should return from brand filters to home with back', () => {
			const selector = new PaintSelector({
				paints,
				brands
			});

			selector.press(8);
			selector.press(25);

			expect(selector.slots[8].button).toMatchObject({
				type: 'brand',
				label: 'Citadel'
			});
		});
	});
});
