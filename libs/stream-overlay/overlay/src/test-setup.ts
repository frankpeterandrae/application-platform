/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';
import type { TestingModuleMetadata } from '@application-platform/testing';
import { setupTestingModule as sharedSetup } from '@application-platform/testing';
import '@application-platform/testing/analog';

import de from './assets/i18n/de.json';
import en from './assets/i18n/en.json';

/**
 * Sets up the shared Angular test environment for this library.
 *
 * @param metadata Angular test module metadata.
 * @returns A promise that resolves when the testing module has been compiled.
 */
export function setupTestingModule(metadata: TestingModuleMetadata): Promise<void> {
	return sharedSetup(metadata, { en, de });
}
