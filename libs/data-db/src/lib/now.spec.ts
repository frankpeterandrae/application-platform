/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nowIso } from './now';

describe('nowIso', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns the current time as ISO string', () => {
		vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-03-23T12:34:56.789Z');

		expect(nowIso()).toBe('2026-03-23T12:34:56.789Z');
	});

	it('returns value in ISO 8601 format when not mocked', () => {
		const result = nowIso();

		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});
});
