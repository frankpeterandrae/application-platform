/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PaintColorGroup } from './paint-color-group.model';

/**
 * Hexadecimal color value.
 */
export type HexColor = `#${string}`;

/**
 * Identifier of a paint composed of brand and SKU.
 */
export type PaintId<B extends string = string, S extends string = string> = `${B}:${S}`;

/**
 * Defines the common properties of a paint.
 */
export interface PaintDefinition {
	readonly name: string;

	/**
	 * Product range, e.g. Citadel Colour, Warpaints Fanatic, Game Color.
	 */
	readonly range?: string;

	/**
	 * Manufacturer-specific category, e.g. base, layer, shadow, metallic.
	 */
	readonly category?: string;

	readonly mainColor: HexColor;
	readonly secondaryColor?: HexColor;

	readonly barcode?: string;

	readonly colorGroups: readonly PaintColorGroup[];
}

/**
 * Defines paint data before brand, SKU and ID are added.
 */
export type PaintSourceDefinition = PaintDefinition & {
	readonly id?: never;
	readonly brand?: never;
	readonly sku?: never;
};

/**
 * Represents a fully identified paint.
 */
export type Paint<B extends string = string, S extends string = string, D extends PaintSourceDefinition = PaintSourceDefinition> = Readonly<
	Omit<D, 'id' | 'brand' | 'sku'> & {
		readonly id: PaintId<B, S>;
		readonly brand: B;
		readonly sku: S;
	}
>;
