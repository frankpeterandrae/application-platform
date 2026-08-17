/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintSourceDefinition } from '../model/paint.model';

/**
 * Maps paint SKUs to fully identified paints of a specific brand.
 */
export type PaintCollection<B extends string, D extends Record<string, PaintSourceDefinition>> = {
	readonly [S in keyof D & string]: Paint<B, S, D[S]>;
};

type MutablePaintCollection<B extends string, D extends Record<string, PaintSourceDefinition>> = {
	[S in keyof D & string]: Paint<B, S, D[S]>;
};

/**
 * Defines a collection of paints for a specific brand.
 * @param brand The paint brand.
 * @param definitions The paint definitions, keyed by SKU.
 * @returns A collection of paints, keyed by SKU.
 */
export function definePaints<const B extends string, const D extends Record<string, PaintSourceDefinition>>(
	brand: B,
	definitions: D
): PaintCollection<B, D> {
	const createPaint = <S extends keyof D & string>(sku: S, definition: D[S]): Paint<B, S, D[S]> => ({
		...definition,
		id: `${brand}:${sku}`,
		brand,
		sku
	});

	const paints = {} as MutablePaintCollection<B, D>;

	for (const sku of Object.keys(definitions) as Array<keyof D & string>) {
		paints[sku] = createPaint(sku, definitions[sku]);
	}

	return paints;
}
