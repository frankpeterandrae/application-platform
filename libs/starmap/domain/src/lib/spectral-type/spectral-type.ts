/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

const SPECIAL_SPECTRAL_TYPES = ['BD', 'WD', 'NS', 'BH'] as const;

/**
 * Checks if the given value is a valid spectral type.
 * @param value The value to check.
 * @returns True if the value is a valid spectral type, false otherwise.
 */
export function isValidSpectralType(value: string): boolean {
	if (SPECIAL_SPECTRAL_TYPES.includes(value as (typeof SPECIAL_SPECTRAL_TYPES)[number])) {
		return true;
	}

	return /^(?:O[5-9]|[BAFGKM]\d)(?:I|III)?$/.test(value);
}
