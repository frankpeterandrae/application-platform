/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import '@angular/compiler';
import type { TestModuleMetadata } from '@angular/core/testing';
import { setupTestingModule as sharedSetup } from '@application-platform/testing';
import '@application-platform/testing/analog';

/**
 * Sets up the shared Angular test environment for this library.
 */
export function setupTestingModule({ imports = [], providers = [], declarations }: TestModuleMetadata): Promise<void> {
	return sharedSetup({ imports, providers, declarations });
}
