/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import en from '../public/assets/i18n/en.json';
import de from '../public/assets/i18n/de.json';
import { TestModuleMetadata } from '@angular/core/testing';
import { sharedSetupTestingModule } from '@angular-apps/testing';

setupZoneTestEnv();

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} metadata - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<any>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule(metadata: TestModuleMetadata): Promise<any> {
	return sharedSetupTestingModule(metadata, { en, de });
}
