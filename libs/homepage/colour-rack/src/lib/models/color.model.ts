/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

export interface Color {
	name: string;
	alternativeNames: string[];
	type: string;
	mainColor: string;
	secondaryColor?: string;
	highlighted?: boolean;
	wave?: string;
	sku?: string;
	barcode?: string;
	row?: number;
	column?: number;
}
