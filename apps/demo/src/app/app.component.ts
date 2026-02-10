/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AfterViewInit, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
	DropdownOption,
	DropdownSelectComponent,
	FooterComponent,
	HeaderComponent,
	IconDefinition
} from '@application-platform/shared/ui-theme';

/**
 * The root component of the demo application.
 */
@Component({
	imports: [RouterOutlet, HeaderComponent, DropdownSelectComponent, FooterComponent],
	selector: 'demo-root',
	templateUrl: './app.component.html'
})
export class AppComponent implements AfterViewInit {
	private readonly id = 'homepage-theme';
	private link = document.getElementById(this.id) as HTMLLinkElement | null;

	/** The title of the application. */
	public title = 'demo';

	public selectedTheme = signal<'homepage' | 'z21'>('homepage');

	public readonly opts = signal<DropdownOption<'homepage' | 'z21'>[]>([]);

	/**
	 * Constructor
	 *
	 * Initializes the sidebar menu items and sets the default theme.
	 * Avoid heavy DOM work here — `setTheme` only creates/appends a link element.
	 */
	constructor() {
		this.setTheme('homepage');
	}

	/**
	 * Angular lifecycle hook AfterViewInit
	 *
	 * Sets the dropdown options after the view has been initialized. This ensures
	 * that any child components receiving `opts` as input will observe the
	 * populated options after initial rendering.
	 */
	ngAfterViewInit(): void {
		this.opts.set([
			{ value: 'homepage', label: 'Homepage', icon: IconDefinition.COMPUTER },
			{ value: 'z21', label: 'Z21', icon: IconDefinition.Z21 }
		]);
	}

	/**
	 * setTheme
	 *
	 * Ensures a <link id="{this.id}"> exists in document.head that points to the
	 * stylesheet for the requested theme bundle, then updates its href to
	 * switch the stylesheet.
	 *
	 * Implementation details:
	 * - If a link element with the configured id already exists, it is reused.
	 * - Otherwise a new <link rel="stylesheet"> element is created and appended.
	 * - The method accepts `bundleName` which may be null; the computed URL uses
	 *   the pattern `${bundleName}-theme.css`. If `bundleName` is null the href
	 *   becomes `'null-theme.css'` — callers should normally pass a valid bundleName.
	 *
	 * @param bundleName - The base name of the theme bundle (e.g. 'homepage', 'z21'),
	 *                     or null if no specific bundle is requested.
	 */
	public setTheme(bundleName: 'homepage' | 'z21' | null): void {
		if (bundleName) {
			this.selectedTheme.set(bundleName);
		}
		const themeBundleName = `${bundleName}-theme`;

		// Always prefer an element that exists in the document (tests may remove the
		// element from document.head but the instance may still hold a reference).
		const existing = document.getElementById(this.id) as HTMLLinkElement | null;
		if (existing) {
			this.link = existing;
		}

		// If we don't have a link or the previously stored link was removed from the
		// document (not connected), create and append a new one.
		if (!this.link?.isConnected) {
			this.link = document.createElement('link');
			this.link.id = this.id;
			this.link.rel = 'stylesheet';
			document.head.appendChild(this.link);
		}

		this.link.href = `${themeBundleName}.css`;
	}
}
