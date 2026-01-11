/*
 * Copyright (c) 2026. Frank-Peter Andrä
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

beforeEach((): void => {
	TestBed.resetTestingModule();
});

/**
 *
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetupTestingModule({ imports, providers, declarations });
}
