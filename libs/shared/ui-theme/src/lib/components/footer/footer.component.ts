/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslationPipe } from '@application-platform/services';

/**
 * FooterComponent is a standalone Angular component that represents the footer section of the theme.
 */
@Component({
	selector: 'theme-footer',
	imports: [TranslationPipe, AsyncPipe],
	templateUrl: './footer.component.html'
})
export class FooterComponent {}
