/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TranslationObject } from './translation.types.js';
export async function loadTranslations(language: string): Promise<TranslationObject> {
	// Relative to the hosting application, not the Web Component's JS bundle.
	const response = await fetch(`drv/i18n/${encodeURIComponent(language)}.json`);
	if (!response.ok) throw new Error(`Could not load translations for language: ${language}`);
	return response.json() as Promise<TranslationObject>;
}
