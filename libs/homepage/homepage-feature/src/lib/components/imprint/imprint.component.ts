/*
 * Copyright (c) 2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { TranslationDirective } from '@angular-apps/shared-ui';
import { featureTextModules } from '../../i18n/i18n';

/**
 * TOTO: Description.
 */
@Component({
	selector: 'homepage-feature-imprint',
	imports: [TranslationDirective],
	templateUrl: './imprint.component.html',
	styleUrl: './imprint.component.scss'
})
export class ImprintComponent {
	protected readonly featureTextModules = featureTextModules;
}
