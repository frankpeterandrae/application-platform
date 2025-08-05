/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// runtime wrapper for tests — avoid type-only imports to keep the Vite/ESBuild plugin happy
import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { sharedSetupTestingModule } from '@application-platform/testing';

import de from '../public/assets/i18n/de.json';
import en from '../public/assets/i18n/en.json';

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} metadata - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule(metadata: TestModuleMetadata): Promise<any> {
	return sharedSetupTestingModule(metadata, { en, de });
}
