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

export const PLANET_TYPES: ReadonlyArray<{
	value: PlanetType;
	label: string;
}> = [
	{ value: 'terran', label: 'Erdähnlich' },
	{ value: 'barren', label: 'Ödland' },
	{ value: 'gas_giant', label: 'Gasriese' },
	{ value: 'ice', label: 'Eiswelt' },
	{ value: 'ocean', label: 'Ozeanwelt' },
	{ value: 'desert', label: 'Wüstenwelt' },
	{ value: 'volcanic', label: 'Vulkanwelt' },
	{ value: 'other', label: 'Sonstige' }
];
