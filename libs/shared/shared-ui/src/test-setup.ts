/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// runtime wrapper for tests — avoid type-only imports to keep the Vite/ESBuild plugin happy
import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { setupTestingModule as sharedSetup } from '@application-platform/testing';

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetup({ imports, providers, declarations });
}
