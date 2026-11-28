/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

/** Describes a paint color displayed in the colour rack. */
export interface Color {
	name: string;
	alternativeNames: string[];
	type: ColorTypeCode;
	mainColor: string;
	secondaryColor?: string;
	wave?: string;
	sku?: string;
	barcode?: string;
	row?: number;
	column?: number;
}

export type ColorTypeCode = 'M' | 'S' | 'H' | 'ME' | 'W' | 'G' | 'E' | 'B' | 'I' | 'DA' | 'S-ME' | 'M-ME' | 'H-ME';
