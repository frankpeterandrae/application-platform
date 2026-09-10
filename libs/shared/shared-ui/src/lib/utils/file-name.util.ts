/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Creates a file name from the given name by normalizing it.
 * @param name - The name to normalize.
 * @param fallback - The fallback name to use if the normalized name is empty. Defaults to 'starmap'.
 * @returns The normalized file name.
 */
export function createFileName(name: string, fallback = 'starmap'): string {
	const normalized = name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-_]/g, '');

	return normalized || fallback;
}
