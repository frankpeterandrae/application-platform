/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import en from './assets/i18n/theme/en.json';
import de from './assets/i18n/theme/de.json';
import { TestModuleMetadata } from '@angular/core/testing';
import { sharedSetupTestingModule } from '@angular-apps/testing';

setupZoneTestEnv();

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<any>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<any> {
	return sharedSetupTestingModule({ imports, providers, declarations }, { en, de });
}
