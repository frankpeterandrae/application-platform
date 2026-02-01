/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { setupTestingModule } from '../test-setup';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
	let fixture: ComponentFixture<AppComponent>;

	beforeEach(async () => {
		// Prevent Angular from trying to resolve external templateUrl/styleUrls during tests
		TestBed.overrideComponent(AppComponent, { set: { template: '<div></div>', styles: [''] } });

		await setupTestingModule({
			imports: [AppComponent],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						params: of({}),
						snapshot: {
							paramMap: {
								/**
								 * Mocked get.
								 * @returns Null.
								 */
								get: (): any => null
							}
						}
					}
				}
			]
		});

		fixture = TestBed.createComponent(AppComponent);
	});

	it('should create the app', () => {
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should have the correct title', () => {
		const app = fixture.componentInstance;
		expect(app.title).toEqual('demo');
	});

	it('has selectedTheme defaulted to homepage', () => {
		const app = fixture.componentInstance;
		expect(app.selectedTheme()).toEqual('homepage');
	});

	it('initializes menuItems with the expected routes', () => {
		const app = fixture.componentInstance;
		expect(Array.isArray(app.menuItems)).toBeTruthy();
		expect(app.menuItems.map((i) => i.route)).toEqual(['button', 'colors', 'icons', 'typography']);
	});

	it('populates opts with homepage and z21 options after view init', () => {
		const app = fixture.componentInstance;
		fixture.detectChanges();
		const opts = app.opts();
		expect(Array.isArray(opts)).toBeTruthy();
		expect(opts.length).toEqual(2);
		expect(opts[0].value).toEqual('homepage');
		expect(opts[1].value).toEqual('z21');
	});

	it('creates a link element with the expected href when setting a theme', () => {
		const app = fixture.componentInstance;
		document.querySelectorAll('#homepage-theme').forEach((n) => n.remove());
		app.setTheme('z21');
		const link = document.getElementById('homepage-theme') as HTMLLinkElement | null;
		expect(link).toBeTruthy();
		expect(link?.getAttribute('href')).toEqual('z21-theme.css');
	});

	it('does not create duplicate link elements when setTheme is called multiple times and updates href', () => {
		const app = fixture.componentInstance;
		document.querySelectorAll('#homepage-theme').forEach((n) => n.remove());
		app.setTheme('homepage');
		app.setTheme('z21');
		expect(document.querySelectorAll('#homepage-theme').length).toEqual(1);
		const link = document.getElementById('homepage-theme') as HTMLLinkElement | null;
		expect(link?.getAttribute('href')).toEqual('z21-theme.css');
	});

	it('handles a null bundleName by setting href to null-theme.css', () => {
		const app = fixture.componentInstance;
		document.querySelectorAll('#homepage-theme').forEach((n) => n.remove());
		app.setTheme(null);
		const link = document.getElementById('homepage-theme') as HTMLLinkElement | null;
		expect(link).toBeTruthy();
		expect(link?.getAttribute('href')).toEqual('null-theme.css');
	});
});
