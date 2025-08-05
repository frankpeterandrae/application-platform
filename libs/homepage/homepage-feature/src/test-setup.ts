/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { setupTestingModule as sharedSetup } from '@application-platform/testing';

import de from './assets/i18n/feature/de.json';
import en from './assets/i18n/feature/en.json';

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetup({ imports, providers, declarations }, { en, de });
}
