/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/** Returns true when value is a plain object (and not an array). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recursively merges plain-object patches into target values. */
export function deepMerge<T>(target: T, patch: unknown): T {
	if (!isPlainObject(target) || !isPlainObject(patch)) {
		return patch as T;
	}

	const result: Record<string, unknown> = { ...target };

	for (const [key, value] of Object.entries(patch)) {
		const current = result[key];

		if (isPlainObject(current) && isPlainObject(value)) {
			result[key] = deepMerge(current, value);
		} else {
			result[key] = value;
		}
	}

	return result as T;
}
