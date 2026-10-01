/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { ProviderScope, TRANSLOCO_SCOPE, TranslocoScope, TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

/**
 * Translates a key using the configured Transloco scope.
 *
 * @example
 * ```html
 * <p>{{ 'myKey' | fpaSharedUiTranslate }}</p>
 * <p>{{ 'myKey' | fpaSharedUiTranslate : 'my-scope' }}</p>
 * <p>{{ 'myKey' | fpaSharedUiTranslate : 'my-scope' : { name: 'John' } }}</p>
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
	 * Translates the given key using an optional scope and interpolation parameters.
	 */
	public transform(key: string, scope?: string | string[] | TranslocoScope, params?: Record<string, unknown>): string {
		if (!this.translocoService) {
			return key;
		}

		const rawScope = scope ?? this.activeScope;
		const resolvedScope = this.resolveScope(rawScope);

		const paramsChanged = JSON.stringify(params) !== JSON.stringify(this.lastParams);
		const inputsChanged = key !== this.lastKey || resolvedScope !== this.lastScope || paramsChanged;

		if (inputsChanged) {
			this.lastKey = key;
			this.lastScope = resolvedScope;
			this.lastParams = params;

			this.subscription?.unsubscribe();

			this.subscription = this.translocoService
				.selectTranslate(key, params, resolvedScope ? { scope: resolvedScope } : undefined)
				.subscribe((value) => {
					if (value !== this.lastValue) {
						this.lastValue = value;
						// Ensure zoneless change detection picks up async translation updates.
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
	 * Resolves the configured Transloco scope to a single scope name.
	 *
	 * @param scope The configured Transloco scope.
	 * @returns The resolved scope name, or `undefined` if no scope is configured.
	 */
	private resolveScope(scope: string | ProviderScope | string[] | null | undefined): string | undefined {
		if (!scope) return undefined;
		if (typeof scope === 'string') return scope;
		if (Array.isArray(scope)) return scope[0];
		return scope.scope;
	}
}
