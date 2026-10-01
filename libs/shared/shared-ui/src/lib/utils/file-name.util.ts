/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Normalizes a name for use as a file name.
 *
 * @param name The value to normalize.
 * @param fallback The value returned if normalization produces an empty name.
 * @returns The normalized file name or the fallback value.
 */
export function createFileName(name: string, fallback = 'starmap'): string {
	const normalized = name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-_]/g, '');

	return normalized || fallback;
}
