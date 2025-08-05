/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Directive, effect, ElementRef, inject, Injector, input, OnInit, runInInjectionContext } from '@angular/core';
import { ProviderScope, translateSignal, TranslocoScope, TRANSLOCO_SCOPE } from '@jsverse/transloco';

/**
 * TranslationDirective is an Angular directive that translates text content
 * of an HTML element using the Transloco library.
 * It listens for changes in the translation key and updates the element's text content accordingly.
 */
@Directive({
	selector: '[fpaSharedUiTranslate]',
	standalone: true
})
export class TranslationDirective implements OnInit {
	private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly activeScope = inject<TranslocoScope>(TRANSLOCO_SCOPE, { optional: true });

	public readonly fpaSharedUiTranslate = input.required<string>();
	public readonly fpaSharedUiTranslateParams = input<Record<string, unknown>>();
	public readonly fpaSharedUiTranslateScope = input<string | string[] | TranslocoScope>();

	private readonly injector = inject(Injector);

	/**
	 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
	 * Initializes the component by setting the title and meta description using translations.
	 */
	ngOnInit(): void {
		const suffix = this.el.nativeElement.textContent;
		this.el.nativeElement.textContent = '';

		const rawScope = this.fpaSharedUiTranslateScope() ?? this.activeScope;
		const scope = this.resolveScope(rawScope);

		runInInjectionContext(this.injector, () => {
			const sig = translateSignal(this.fpaSharedUiTranslate, this.fpaSharedUiTranslateParams, scope ? { scope } : undefined);

			effect(() => {
				this.el.nativeElement.textContent = sig() + suffix;
			});
		});
	}

	/**
	 * Resolves the current scope.
	 * @param {string | string[] } scope - The given scope.
	 * @returns {string} The resolved scope.
	 */
	private resolveScope(scope: string | ProviderScope | string[] | null | undefined): string | undefined {
		if (!scope) return undefined;
		if (typeof scope === 'string') return scope;
		if (Array.isArray(scope)) return scope[0];
		return scope.scope;
	}
}
