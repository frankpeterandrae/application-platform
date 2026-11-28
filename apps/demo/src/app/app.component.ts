/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
	DropdownOption,
	DropdownSelectComponent,
	FooterComponent,
	HeaderComponent,
	IconDefinition
} from '@application-platform/shared/ui-theme';

type Theme = 'homepage' | 'z21';

/** Lets users preview the demo routes with either application theme. */
@Component({
	imports: [RouterOutlet, HeaderComponent, DropdownSelectComponent, FooterComponent],
	selector: 'demo-root',
	templateUrl: './app.component.html'
})
export class AppComponent {
	private readonly themeStylesheetId = 'homepage-theme';
	private readonly document = inject(DOCUMENT);

	protected readonly selectedTheme = signal<Theme>('homepage');

	protected readonly themeOptions: DropdownOption<Theme>[] = [
		{ value: 'homepage', label: 'Homepage', icon: IconDefinition.COMPUTER },
		{ value: 'z21', label: 'Z21', icon: IconDefinition.Z21 }
	];

	constructor() {
		this.setTheme('homepage');
	}

	protected setTheme(theme: Theme | null): void {
		if (theme === null) {
			return;
		}

		this.selectedTheme.set(theme);

		// Reuse the active stylesheet so only one theme contributes styles.
		let stylesheet = this.document.querySelector<HTMLLinkElement>('link#' + this.themeStylesheetId);
		if (!stylesheet) {
			stylesheet = this.document.createElement('link');
			stylesheet.id = this.themeStylesheetId;
			stylesheet.rel = 'stylesheet';
			this.document.head.appendChild(stylesheet);
		}

		stylesheet.href = `${theme}-theme.css`;
	}
}
