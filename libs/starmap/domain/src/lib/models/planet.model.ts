/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type PlanetType = 'terran' | 'barren' | 'gas_giant' | 'ice' | 'ocean' | 'desert' | 'volcanic' | 'other';

export interface Planet {
	id: string;
	name: string;
	type: PlanetType;
	classification: string;
}
