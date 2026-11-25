/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { HexColor, Paint } from '@application-platform/paint';

/** A paint entry in the exported asset. Its array index defines its rack position. */
export interface Color {
	readonly name: string;
	readonly alternativeNames: readonly string[];
	readonly type: ColorTypeCode;
	readonly mainColor: HexColor;
	readonly secondaryColor?: HexColor;
	readonly wave?: string;
	readonly sku: string;
	readonly barcode?: string;
}

export interface RackColor extends Color {
	readonly row: number;
	readonly column: number;
	readonly searchTerms: readonly string[];
	readonly paint: Paint<'two-thin-coats'>;
}

export type ColorTypeCode = 'M' | 'S' | 'H' | 'ME' | 'W' | 'G' | 'E' | 'B' | 'I' | 'DA' | 'S-ME' | 'M-ME' | 'H-ME';
