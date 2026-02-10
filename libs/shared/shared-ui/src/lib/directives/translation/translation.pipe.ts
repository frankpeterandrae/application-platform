/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { ProviderScope, TranslocoScope, TranslocoService, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

/**
 * TranslationPipe translates a given key using the Transloco library.
 * It returns the translated string value based on the current language and scope.
 *
 * @example
 * ```html
 * <p>{{ 'myKey' | fpaSharedUiTranslate }}</p>
 * <p>{{ 'myKey' | fpaSharedUiTranslate: { name: 'John' } }}</p>
 * <p>{{ 'myKey' | fpaSharedUiTranslate: { name: 'John' } : 'my-scope' }}</p>
 * ```
 */
@Pipe({
	name: 'fpaSharedUiTranslate',
	standalone: true,
	pure: false
})
export class TranslationPipe implements PipeTransform, OnDestroy {
	private readonly activeScope = inject<TranslocoScope>(TRANSLOCO_SCOPE, { optional: true });
	private readonly translocoService = inject(TranslocoService, { optional: true });
	private readonly cdr = inject(ChangeDetectorRef, { optional: true });

	private lastKey = '';
	private lastScope: string | undefined = '';
	private lastParams: Record<string, unknown> | undefined;
	private lastValue = '';
	private subscription?: Subscription;

	/**
	 * Transform the given key into a translated string.
	 * @param {string} key - The translation key to look up.
	 * @param {string | string[] | TranslocoScope} scope - Optional scope for the translation.
	 * @param {Record<string, unknown>} params - Optional parameters for interpolation.
	 * @returns {string} The translated string.
	 */
	public transform(key: string, scope?: string | string[] | TranslocoScope, params?: Record<string, unknown>): string {
		if (!this.translocoService) {
			return key;
		}

		const rawScope = scope ?? this.activeScope;
		const resolvedScope = this.resolveScope(rawScope);

		// Check if inputs changed to decide whether to resubscribe
		const paramsChanged = JSON.stringify(params) !== JSON.stringify(this.lastParams);
		const inputsChanged = key !== this.lastKey || resolvedScope !== this.lastScope || paramsChanged;

		if (inputsChanged) {
			this.lastKey = key;
			this.lastScope = resolvedScope;
			this.lastParams = params;

			// Unsubscribe from previous subscription
			this.subscription?.unsubscribe();

			// Subscribe to translation updates
			this.subscription = this.translocoService
				.selectTranslate(key, params, resolvedScope ? { scope: resolvedScope } : undefined)
				.subscribe((value) => {
					if (value !== this.lastValue) {
						this.lastValue = value;
						// Mark for check to trigger change detection in zoneless environment
						this.cdr?.markForCheck();
					}
				});
		}

		return this.lastValue || key;
	}

	/**
	 * Cleanup subscription on pipe destroy.
	 */
	ngOnDestroy(): void {
		this.subscription?.unsubscribe();
	}

	/**
	 * Resolves the current scope.
	 * @param {string | string[] | TranslocoScope | null | undefined} scope - The given scope.
	 * @returns {string | undefined} The resolved scope.
	 */
	private resolveScope(scope: string | ProviderScope | string[] | null | undefined): string | undefined {
		if (!scope) return undefined;
		if (typeof scope === 'string') return scope;
		if (Array.isArray(scope)) return scope[0];
		return scope.scope;
	}
}
