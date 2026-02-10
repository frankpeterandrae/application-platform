/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { setupTestingModule as sharedSetup } from '@application-platform/testing';
import { of } from 'rxjs';

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	const demoProviders = [
		{
			provide: ActivatedRoute,
			useValue: {
				params: of({}),
				snapshot: {
					paramMap: {
						get: (): any => null
					}
				}
			}
		},
		...providers
	];
	return sharedSetup({ imports, providers: demoProviders, declarations });
}
