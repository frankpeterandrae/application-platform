/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure the Angular JIT compiler is loaded for tests that require runtime compilation fallback.
import '@angular/compiler';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { ModuleWithProviders } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import type { HashMap, Translation, TranslocoConfig } from '@jsverse/transloco';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { MockScopedTranslationService } from './lib/mocks/mocked-scoped-translation-service';

// Initialize TestBed environment for testing using non-deprecated APIs.
// Use BrowserTestingModule instead of deprecated BrowserDynamicTestingModule.
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true
});

/**
 * Sets up the Angular testing module with the provided metadata.
 * @param {TestModuleMetadata} _testModule - The metadata for the test module, including imports, providers, and declarations.
 * @param {HashMap<Translation>} langs - A hashmap of translations for different languages.
 * @param {Partial<TranslocoConfig>} config - Partial configuration for the Transloco module.
 * @returns {Promise<void>} A promise that resolves when the test module is compiled and resources resolved.
 */
export async function sharedSetupTestingModule(
	// accept an untyped options object at runtime to avoid TypeScript-only syntax in test-setup
	_testModule: any,
	langs?: HashMap<Translation>,
	config: Partial<TranslocoConfig> = {}
): Promise<void> {
	const { imports = [], declarations } = _testModule ?? {};
	let providers: any[] = _testModule?.providers || [];

	// Dynamically import Angular common tokens after the compiler is loaded to avoid
	// triggering their static initializers during module load. Then provide lightweight
	// stubs so the TestBed doesn't attempt JIT-compilation on partially compiled libs.
	const angularCommon = await import('@angular/common');
	const PlatformLocation = angularCommon.PlatformLocation;
	const Location = angularCommon.Location;
	const PathLocationStrategy = angularCommon.PathLocationStrategy;

	const platformLocationStub = {
		getBaseHrefFromDOM: () => '/',
		onPopState: (fn: (ev?: any) => any) => {
			return () => undefined;
		},
		onHashChange: (fn: (ev?: any) => any) => {
			return () => undefined;
		},
		pathname: '/',
		search: '',
		hash: '',
		pushState: (_: any) => undefined,
		replaceState: (_: any) => undefined,
		forward: () => undefined,
		back: () => undefined
	};

	const locationStub = {
		path: () => '/',
		prepareExternalUrl: (p: string) => p,
		go: (_: any) => undefined,
		replaceState: (_: any) => undefined,
		forward: () => undefined,
		back: () => undefined,
		normalize: (p: string) => p
	};

	const pathLocationStrategyStub = {
		path: () => '/',
		prepareExternalUrl: (p: string) => p,
		onPopState: (_: any) => undefined,
		onHashChange: (_: any) => undefined,
		pushState: (_: any) => undefined,
		replaceState: (_: any) => undefined,
		forward: () => undefined,
		back: () => undefined
	};

	providers = [
		{ provide: PlatformLocation, useValue: platformLocationStub },
		{ provide: Location, useValue: locationStub },
		{ provide: PathLocationStrategy, useValue: pathLocationStrategyStub },
		...providers
	];

	// Create a fresh default object to avoid shared mutable defaults
	const defaultLangs: HashMap<Translation> = {
		en: { hello: 'Hello' },
		de: { hello: 'Hallo' }
	};
	const usedLangs = langs ?? defaultLangs;

	// Configure and compile the testing module
	await TestBed.configureTestingModule({
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

	// Some Angular runtimes expose resolveComponentResources to load external templateUrl/styleUrls for components.
	// If present, call it to ensure standalone components with external resources are resolved in tests.
	if (typeof (TestBed as unknown as { resolveComponentResources?: () => Promise<void> }).resolveComponentResources === 'function') {
		await (TestBed as unknown as { resolveComponentResources?: () => Promise<void> }).resolveComponentResources?.();
	}
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

// Provide a runtime-friendly alias so wrappers can import `{ setupTestingModule }` from the shared testing package.
export const setupTestingModule = (options: any, langs?: HashMap<Translation>, config: Partial<TranslocoConfig> = {}) => {
	return sharedSetupTestingModule(options, langs, config);
};
