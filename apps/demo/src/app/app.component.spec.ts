/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, assert } from 'vitest';

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

	afterEach(() => {
		document.getElementById('homepage-theme')?.remove();
	});

	it('should render the application shell', () => {
		expect(fixture.nativeElement.querySelector('theme-header')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
		expect(fixture.nativeElement.querySelector('theme-footer')).not.toBeNull();
	});

	it('switches the active stylesheet through the rendered theme selector', () => {
		const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('theme-dropdown-select select');
		assert(select);
		const stylesheet = document.querySelector<HTMLLinkElement>('link#homepage-theme');
		expect(stylesheet?.getAttribute('href')).toBe('homepage-theme.css');

		select.value = '1';
		select.dispatchEvent(new Event('change'));
		fixture.detectChanges();
		expect(stylesheet?.getAttribute('href')).toBe('z21-theme.css');

		select.value = '0';
		select.dispatchEvent(new Event('change'));
		fixture.detectChanges();
		expect(stylesheet?.getAttribute('href')).toBe('homepage-theme.css');
		expect(document.querySelectorAll('link#homepage-theme')).toHaveLength(1);
	});
});
