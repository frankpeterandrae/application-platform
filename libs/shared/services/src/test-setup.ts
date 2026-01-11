/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TestModuleMetadata } from '@angular/core/testing';
// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';

import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { sharedSetupTestingModule } from '@application-platform/testing';

// Initialize the Angular testing environment (TestBed) for the current runtime.
const platform = platformBrowserTesting();
getTestBed().initTestEnvironment(BrowserTestingModule, platform);

// Reset TestBed and mocks before each test to emulate jest-preset-angular behavior.
beforeEach(() => {
	TestBed.resetTestingModule();
	vi.resetAllMocks();
});

afterEach(() => {
	vi.resetAllMocks();
});

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetupTestingModule({ imports, providers, declarations });
}
