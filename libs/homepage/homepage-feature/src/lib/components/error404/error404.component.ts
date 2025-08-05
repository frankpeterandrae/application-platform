/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { ButtonColorDefinition, ButtonComponent, CardComponent } from '@angular-apps/shared/ui-theme';
import { Router } from '@angular/router';
import { BaseComponent, LOGGER_SOURCE, Scopes, TranslationDirective } from '@angular-apps/shared-ui';
import { featureTextModules } from '../../i18n/i18n';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';

/**
 * Component for displaying a 404 error page.
 */
@Component({
	selector: 'homepage-feature-error404',
	imports: [ButtonComponent, CardComponent, TranslationDirective],
	templateUrl: './error404.component.html',
	providers: [{ provide: LOGGER_SOURCE, useValue: 'Error404Component' }, provideTranslocoScope(Scopes.FEATURE)]
})
export class Error404Component extends BaseComponent {
	private readonly router = inject(Router);
	public readonly featureTextModules = featureTextModules;
	public readonly ButtonColorDefinition = ButtonColorDefinition;
	public readonly backToStart = translateSignal(featureTextModules.Error404Component.lbl.BackToStartpage);

	/**
	 * Navigates to the home page.
	 */
	public routeToHome(): void {
		this.router.navigate(['/']).catch((error) => this.logger.error('Error while navigating to home page', error));
	}
}
