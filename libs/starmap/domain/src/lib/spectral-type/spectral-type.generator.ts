/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

interface SpectralThreshold {
	readonly max: number;
	readonly subtype: number;
}

const MAIN_SEQUENCE_THRESHOLDS: readonly SpectralThreshold[] = [
	{ max: 8, subtype: 0 },
	{ max: 17, subtype: 1 },
	{ max: 26, subtype: 2 },
	{ max: 35, subtype: 3 },
	{ max: 45, subtype: 4 },
	{ max: 55, subtype: 5 },
	{ max: 66, subtype: 6 },
	{ max: 77, subtype: 7 },
	{ max: 88, subtype: 8 }
];

const B_SEQUENCE_THRESHOLDS: readonly SpectralThreshold[] = [
	{ max: 4, subtype: 0 },
	{ max: 10, subtype: 1 },
	{ max: 16, subtype: 2 },
	{ max: 21, subtype: 3 },
	{ max: 28, subtype: 4 },
	{ max: 37, subtype: 5 },
	{ max: 48, subtype: 6 },
	{ max: 62, subtype: 7 },
	{ max: 79, subtype: 8 }
];

const O_SEQUENCE_THRESHOLDS: readonly SpectralThreshold[] = [
	{ max: 12, subtype: 5 },
	{ max: 26, subtype: 6 },
	{ max: 42, subtype: 7 },
	{ max: 60, subtype: 8 }
];

/**
 * Determines the spectral type of each star in the system.
 *
 * The data generated is stored in the stars list and is simply
 * a string naming the spectral type of the object
 */
export function randomSpectralType(): string {
	const roll = randomInt(1, 100);

	if (roll <= 8) {
		return 'BD';
	}

	if (roll <= 82) {
		return getMSSubType('M');
	}

	if (roll <= 89) {
		return getMSSubType('K');
	}

	if (roll <= 92) {
		return getMSSubType('G');
	}

	if (roll <= 94) {
		return getMSSubType('F');
	}

	if (roll <= 99) {
		return 'WD';
	}

	return getRareSpectralType();
}

/**
 * Determines one of the rare spectral types.
 * @returns The generated spectral type.
 */
function getRareSpectralType(): string {
	const roll = randomInt(1, 1000);

	if (roll <= 583) {
		return getMSSubType('A');
	}

	if (roll <= 666) {
		return getMSSubType('B');
	}

	if (roll <= 999) {
		return `${getGiantSpectralType()}III`;
	}

	return getVeryRareSpectralType();
}

/**
 * Determines one of the very rare spectral types.
 * @returns The generated spectral type.
 */
function getVeryRareSpectralType(): string {
	const roll = randomInt(1, 100);

	if (roll <= 9) {
		return getMSSubType('O');
	}

	if (roll <= 99) {
		return `${getGiantSpectralType()}I`;
	}

	return getCompactObjectSpectralType();
}

/**
 * Determines whether a compact object is a black hole or neutron star.
 * @returns The generated compact object spectral type.
 */
function getCompactObjectSpectralType(): string {
	const roll = randomInt(1, 10);

	if (roll === 10) {
		return 'BH';
	}
	return 'NS';
}

/**
 * Calculates the main-sequence subtype for the given spectral class.
 * @param spClass The spectral class.
 * @returns The generated spectral subtype.
 */
function getMSSubType(spClass: string): string {
	const roll = randomInt(1, 100);

	if (['A', 'F', 'G', 'K', 'M'].includes(spClass)) {
		return `${spClass}${getSubtype(roll, MAIN_SEQUENCE_THRESHOLDS, 9)}`;
	}

	if (spClass === 'B') {
		return `${spClass}${getSubtype(roll, B_SEQUENCE_THRESHOLDS, 9)}`;
	}

	if (spClass === 'O') {
		return `${spClass}${getSubtype(roll, O_SEQUENCE_THRESHOLDS, 9)}`;
	}

	return '';
}

/**
 * Resolves a subtype from a threshold table.
 * @param roll The generated random value.
 * @param thresholds The subtype thresholds.
 * @param fallback The subtype used if no threshold matches.
 * @returns The corresponding subtype.
 */
function getSubtype(roll: number, thresholds: readonly SpectralThreshold[], fallback: number): number {
	return thresholds.find((threshold) => roll <= threshold.max)?.subtype ?? fallback;
}

/**
 * Generates the spectral types for giant and supergiant stars.
 * The calling function should append the appropriate class identifier
 * (i.e. "I" or "III" to the returned value.
 */
function getGiantSpectralType(): string {
	const roll = randomInt(1, 100);

	if (roll < 83) {
		return `M${randomInt(0, 9)}`;
	}

	if (roll < 90) {
		return `K${randomInt(0, 9)}`;
	}

	if (roll < 93) {
		return `G${randomInt(0, 9)}`;
	}

	if (roll < 95) {
		return `F${randomInt(0, 9)}`;
	}

	return `K${randomInt(0, 9)}`;
}

/**
 * Generates a random integer between the specified minimum and maximum values (inclusive).
 * @param min The minimum value (inclusive).
 * @param max The maximum value (inclusive).
 * @returns A random integer between min and max.
 */
function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
