/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { setupTestingModule as sharedSetup } from '@application-platform/testing';
import '@application-platform/testing/analog';
import { of } from 'rxjs';

export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	const demoProviders = [
		{
			provide: ActivatedRoute,
			useValue: {
				params: of({}),
				snapshot: {
					paramMap: {
						get: (): null => null
					}
				}
			}
		},
		...providers
	];
	return sharedSetup({ imports, providers: demoProviders, declarations });
}
