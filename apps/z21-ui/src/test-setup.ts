/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { sharedSetupTestingModule } from '@application-platform/testing';

import de from '../public/assets/i18n/de.json';
import en from '../public/assets/i18n/en.json';

/**
 * Sets up the shared Angular test environment for this library.
 *
 * @param metadata Angular test module metadata.
 * @returns A promise that resolves when the testing module has been compiled.
 */
export function setupTestingModule(metadata: TestModuleMetadata): Promise<any> {
	return sharedSetupTestingModule(metadata, { en, de });
}
