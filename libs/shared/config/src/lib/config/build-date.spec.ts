/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';
import { BUILD_DATE } from './build-date';

describe('BUILD_DATE', () => {
	it('should be defined', () => {
		expect(BUILD_DATE).toBeDefined();
	});

	it('should be a string', () => {
		expect(typeof BUILD_DATE).toBe('string');
	});

	it('should export a placeholder or valid date string', () => {
		expect(BUILD_DATE.length).toBeGreaterThan(0);
	});

	it('should be exported correctly', () => {
		expect(BUILD_DATE).toBe('PLACEHOLDER_DATE');
	});
});
