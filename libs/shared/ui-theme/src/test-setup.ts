/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';

// Load zone.js core so the global `Zone` is available for zone testing APIs.
import 'zone.js';

// Ensure zone testing APIs are available for fakeAsync() and other helpers.
import 'zone.js/testing';

import type { TestModuleMetadata } from '@angular/core/testing';
import { sharedSetupTestingModule } from '@application-platform/testing';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

import de from './lib/theme/assets/i18n/theme/de.json';
import en from './lib/theme/assets/i18n/theme/en.json';

setupZoneTestEnv();

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetupTestingModule({ imports, providers, declarations }, { en, de });
}
