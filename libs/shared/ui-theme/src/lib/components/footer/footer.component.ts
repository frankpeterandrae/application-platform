/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { LOGGER_SOURCE, Scopes, TranslationDirective } from '@application-platform/shared-ui';
import { provideTranslocoScope } from '@jsverse/transloco';

import { themeTextModules } from '../../i18n/i18n';

/**
 * FooterComponent is a standalone Angular component that represents the footer section of the theme.
 */
@Component({
	selector: 'theme-footer',
	imports: [TranslationDirective],
	templateUrl: './footer.component.html',
	providers: [{ provide: LOGGER_SOURCE, useValue: 'FooterComponent' }, provideTranslocoScope(Scopes.THEME)]
})
export class FooterComponent {
	public readonly themeTextModules = themeTextModules;
}
