/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { setupTestingModule } from '../test-setup';

import { App } from './app';

describe('App', () => {
	beforeEach(async () => {
		await setupTestingModule({
			imports: [App],
			providers: [provideRouter([])]
		});
	});

	it('should create', () => {
		const fixture = TestBed.createComponent(App);

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render the router outlet', () => {
		const fixture = TestBed.createComponent(App);

		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;

		expect(compiled.querySelector('router-outlet')).not.toBeNull();
	});
});
