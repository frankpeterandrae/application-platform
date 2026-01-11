/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TestModuleMetadata } from '@angular/core/testing';

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';

// Replace jest-preset-angular setup with direct Angular TestBed init compatible with Vitest
import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { sharedSetupTestingModule } from '@application-platform/testing';

import de from '../public/assets/i18n/de.json';
import en from '../public/assets/i18n/en.json';

// Initialize the Angular testing environment (TestBed) for the current runtime using dynamic testing (resolves templateUrl/styleUrls).
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// Reset TestBed and mocks before each test to emulate jest-preset-angular behavior.
beforeEach((): void => {
	// Reset the testing module (keeps TestBed.configureTestingModule available)
	TestBed.resetTestingModule();
	vi.resetAllMocks();
});

afterEach((): void => {
	vi.resetAllMocks();
});

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetupTestingModule({ imports, providers, declarations }, { en, de });
}
