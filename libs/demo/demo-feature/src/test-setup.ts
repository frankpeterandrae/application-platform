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
 *
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetupTestingModule({ imports, providers, declarations });
}
