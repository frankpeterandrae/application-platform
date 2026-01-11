/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { ModuleWithProviders } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';

import type { TestModuleMetadata } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import type { HashMap, Translation, TranslocoConfig } from '@jsverse/transloco';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MockScopedTranslationService } from './lib/mocks/mocked-scoped-translation-service';

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} param0 - The metadata for the test module, including imports, providers, and declarations.
 * @param {HashMap<Translation>} langs - A hashmap of translations for different languages.
 * @param {Partial<TranslocoConfig>} config - Partial configuration for the Transloco module.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled.
 */
export function sharedSetupTestingModule(
	{ imports = [], providers = [], declarations }: TestModuleMetadata,
	langs?: HashMap<Translation>,
	config: Partial<TranslocoConfig> = {}
): Promise<void> {
	// Create a fresh default object to avoid shared mutable defaults
	const defaultLangs: HashMap<Translation> = {
		en: { hello: 'Hello' },
		de: { hello: 'Hallo' }
	};
	const usedLangs = langs ?? defaultLangs;

	return TestBed.configureTestingModule({
		imports: [translocoTestingModulFactory(config, usedLangs), ...imports],
		providers: [
			{ provide: ScopedTranslationServiceInterface, useClass: MockScopedTranslationService },
			provideHttpClient(),
			provideHttpClientTesting(),
			...providers
		],
		declarations,
		schemas: [NO_ERRORS_SCHEMA]
	}).compileComponents();
}

/**
 * Creates a Transloco testing module with the provided configuration.
 * @param {Partial<TranslocoConfig>} config - Partial configuration for the Transloco module.
 * @param {HashMap<Translation>} langs - A hashmap of translations for different languages.
 * @returns {ModuleWithProviders<TranslocoTestingModule>} The configured Transloco testing module.
 */
function translocoTestingModulFactory(
	config: Partial<TranslocoConfig>,
	langs?: HashMap<Translation>
): ModuleWithProviders<TranslocoTestingModule> {
	const defaultLangs: HashMap<Translation> = {
		en: { hello: 'Hello' },
		de: { hello: 'Hallo' }
	};
	const usedLangs = langs ?? defaultLangs;

	return TranslocoTestingModule.forRoot({
		langs: usedLangs,
		translocoConfig: { availableLangs: ['en', 'de'], defaultLang: 'en', ...config }
	});
}
