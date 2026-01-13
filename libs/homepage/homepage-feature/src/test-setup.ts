/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';

import type { TestModuleMetadata } from '@angular/core/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { sharedSetupTestingModule } from '@application-platform/testing';
import { vi } from 'vitest';

import de from './lib/assets/i18n/feature/de.json';
import en from './lib/assets/i18n/feature/en.json';

// Initialize TestBed environment for dynamic compilation (templateUrl/styleUrls)
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// Use Vitest globals directly (vi) instead of a jest->vi shim

beforeEach((): void => {
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
