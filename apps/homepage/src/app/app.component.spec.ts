/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import { environment } from '../environments/environment';
import { setupTestingModule } from '../test-setup';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
	let fixture: ComponentFixture<AppComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [AppComponent],
			providers: [provideRouter([])]
		});

		fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();
	});

	it('should render the application shell', () => {
		expect(fixture.nativeElement.querySelector('theme-header')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('theme-language-toggle')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('theme-footer')).not.toBeNull();
	});

	it('renders navigation links in the active language', async () => {
		const shell = fixture.nativeElement as HTMLElement;
		const home = shell.querySelector<HTMLAnchorElement>('nav a[href="/"]');
		const rack = shell.querySelector<HTMLAnchorElement>('nav a[href="/paint-rack"]');
		const translations = TestBed.inject(TranslocoService);

		translations.setActiveLang('en');
		await fixture.whenStable();
		fixture.detectChanges();
		expect(home?.textContent?.trim()).toBe('Home');
		expect(rack?.textContent?.trim()).toBe('Paint rack');

		translations.setActiveLang('de');
		await fixture.whenStable();
		fixture.detectChanges();
		expect(home?.textContent?.trim()).toBe('Startseite');
		expect(rack?.textContent?.trim()).toBe('Farbregal');
	});

	it('shows the demo link in development', () => {
		const demoLink = fixture.nativeElement.querySelector('nav a[href="/dev/demo"]');

		expect(Boolean(demoLink)).toBe(!environment.production);
	});
});
