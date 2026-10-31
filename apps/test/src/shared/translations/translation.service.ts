/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { I18nOptions, TranslationObject, TranslationParams, TranslationValue } from './translation.types.js';
export class I18n {
	private currentLanguage: string;
	private readonly translations = new Map<string, TranslationObject>();
	private readonly loadingLanguages = new Map<string, Promise<void>>();
	public constructor(private readonly options: I18nOptions) {
		this.currentLanguage = options.defaultLanguage;
	}
	public async init(): Promise<void> {
		await this.loadLanguage(this.currentLanguage);
	}
	public async setLanguage(language: string): Promise<void> {
		await this.loadLanguage(language);
		this.currentLanguage = language;
	}
	public getLanguage(): string {
		return this.currentLanguage;
	}
	public async loadLanguage(language: string): Promise<void> {
		if (this.translations.has(language)) return;
		const existingLoad = this.loadingLanguages.get(language);
		if (existingLoad) return existingLoad;
		const loadPromise = this.options
			.loader(language)
			.then((translations) => {
				this.translations.set(language, translations);
			})
			.finally(() => {
				this.loadingLanguages.delete(language);
			});
		this.loadingLanguages.set(language, loadPromise);
		return loadPromise;
	}
	public t(key: string, params?: TranslationParams): string {
		const translation = this.resolveTranslation(this.currentLanguage, key) ?? this.resolveFallback(key) ?? key;
		return this.interpolate(translation, params);
	}
	private resolveFallback(key: string): string | undefined {
		return this.options.fallbackLanguage ? this.resolveTranslation(this.options.fallbackLanguage, key) : undefined;
	}
	private resolveTranslation(language: string, key: string): string | undefined {
		const translations = this.translations.get(language);
		if (!translations) return undefined;
		const value = key.split('.').reduce<TranslationValue | undefined>((current, part) => {
			if (!current || typeof current !== 'object') return undefined;
			return Object.hasOwn(current, part) ? current[part] : undefined;
		}, translations);
		return typeof value === 'string' ? value : undefined;
	}
	private interpolate(text: string, params?: TranslationParams): string {
		if (!params) return text;
		return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => (Object.hasOwn(params, key) ? String(params[key]) : match));
	}
}
