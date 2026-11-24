/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Color, ColorTypeCode } from '../src/lib/models/color.model';

const brand = 'two-thin-coats';
const matchBrandOrder = ['(GW)', '(VGC)', '(AP)'];
const types: ReadonlySet<string> = new Set<ColorTypeCode>(['M', 'S', 'H', 'ME', 'W', 'G', 'E', 'B', 'I', 'DA', 'S-ME', 'M-ME', 'H-ME']);
const hexColor = /^#[0-9a-f]{6}$/i;

function matchBrandRank(name: string): number {
	const index = matchBrandOrder.findIndex((suffix) => name.endsWith(suffix));
	return index === -1 ? matchBrandOrder.length : index;
}

function rows(data: unknown, source: string): Record<string, unknown>[] {
	if (!Array.isArray(data)) {
		throw new TypeError(`${source}: expected a JSON array`);
	}
	return data.map((row: unknown, index) => {
		if (!row || typeof row !== 'object' || Array.isArray(row)) {
			throw new TypeError(`${source}[${index}]: expected an object`);
		}
		return row as Record<string, unknown>;
	});
}

function required(value: unknown, field: string, context: string, pattern?: RegExp): string {
	if (typeof value !== 'string' || !value.trim() || (pattern && !pattern.test(value))) {
		throw new Error(`${context}: invalid or missing ${field} (${JSON.stringify(value)})`);
	}
	return value;
}

export function mapRackColors(paintData: unknown, matchData: unknown, layout: readonly string[]): Color[] {
	const paints = new Map<string, Record<string, unknown>>();
	for (const [index, paint] of rows(paintData, `${brand}.json`).entries()) {
		const sku = required(paint['sku'], 'sku', `${brand}.json[${index}]`);
		const id = `${brand}:${sku}`;
		if (paint['brand_id'] !== brand || paint['id'] !== id) {
			throw new Error(`${id}: expected matching brand_id and id`);
		}
		if (paints.has(sku)) {
			throw new Error(`${id}: duplicate paint SKU`);
		}
		paints.set(sku, paint);
	}

	const names = new Map<string, Set<string>>();
	for (const [index, match] of rows(matchData, 'paint_match.json').entries()) {
		const id = required(match['paint_id'], 'paint_id', `paint_match.json[${index}]`);
		if (!id.startsWith(`${brand}:`)) continue;

		const sku = id.slice(brand.length + 1);
		if (!paints.has(sku)) {
			throw new Error(`paint_match.json: unknown paint ${id}`);
		}
		const alternatives = names.get(sku) ?? new Set<string>();
		alternatives.add(required(match['name'], 'name', `paint_match.json[${index}] (${id})`));
		names.set(sku, alternatives);
	}

	const occupied = new Set<string>();
	return layout.map((sku, index) => {
		const id = `${brand}:${sku}`;
		const paint = paints.get(sku);
		if (!paint || occupied.has(sku)) {
			throw new Error(`rack-layout.json[${index}]: ${paint ? 'duplicate' : 'unknown'} paint ${id}`);
		}
		occupied.add(sku);

		const type = required(paint['category'], 'category', id);
		if (!types.has(type)) {
			throw new Error(`${id}: unsupported category ${JSON.stringify(type)}`);
		}
		const color: Color = {
			name: required(paint['name'], 'name', id),
			alternativeNames: [...(names.get(sku) ?? [])].sort(
				(left, right) => matchBrandRank(left) - matchBrandRank(right) || left.localeCompare(right, 'en')
			),
			type: type as ColorTypeCode,
			mainColor: required(paint['main_color'], 'main_color', id, hexColor)
		};
		if (paint['secondary_color'] != null) {
			color.secondaryColor = required(paint['secondary_color'], 'secondary_color', id, hexColor);
		}
		if (paint['range'] != null) {
			color.wave = required(paint['range'], 'range', id);
		}
		color.sku = sku;
		if (paint['barcode'] != null) {
			color.barcode = required(paint['barcode'], 'barcode', id, /^\d+$/);
		}
		return color;
	});
}
