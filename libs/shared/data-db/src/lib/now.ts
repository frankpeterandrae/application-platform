/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/** Returns the current date and time as an ISO 8601 string. */
export function nowIso(): string {
	return new Date().toISOString();
}
