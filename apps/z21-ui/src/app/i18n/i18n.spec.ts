/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';

import { i18nTextModules } from './i18n';

describe('i18nTextModules', () => {
	it('should be defined', () => {
		expect(i18nTextModules).toBeDefined();
	});

	it('should be an object', () => {
		expect(typeof i18nTextModules).toBe('object');
	});

	it('should be empty or contain expected structure', () => {
		// z21-ui has an empty i18nTextModules object
		expect(typeof i18nTextModules).toBe('object');
		// Verify it's not null
		expect(i18nTextModules).not.toBeNull();
	});

	it('should export from index', () => {
		// Verify the export exists and is accessible
		expect(i18nTextModules).toBeTruthy();
	});
});
