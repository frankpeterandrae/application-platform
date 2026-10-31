/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type TranslationValue = string | TranslationObject;
export interface TranslationObject {
	[key: string]: TranslationValue;
}
export type TranslationParams = Record<string, string | number>;
export type TranslationLoader = (language: string) => Promise<TranslationObject>;
export interface I18nOptions {
	defaultLanguage: string;
	fallbackLanguage?: string;
	loader: TranslationLoader;
}
