/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Directive, effect, ElementRef, inject, Injector, input, OnInit, runInInjectionContext } from '@angular/core';
import { ProviderScope, translateSignal, TRANSLOCO_SCOPE, TranslocoScope } from '@jsverse/transloco';

/**
 * Translates the text content of an element and preserves its existing suffix.
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
