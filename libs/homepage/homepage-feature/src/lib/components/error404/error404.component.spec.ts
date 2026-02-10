/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { LOGGER_SOURCE } from '@application-platform/shared-ui';
import { vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { Error404Component } from './error404.component';

describe('Error404Component', () => {
	let component: Error404Component;
	let fixture: ComponentFixture<Error404Component>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [Error404Component],
			providers: [{ provide: LOGGER_SOURCE, useValue: 'Error404Component' }]
		});

		fixture = TestBed.createComponent(Error404Component);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should set the sets the backToStartpage property with the translated string', async () => {
		// wait for translation simulation
		await new Promise((r) => setTimeout(r, 100));
		fixture.detectChanges();
		expect(component.backToStart()).toBe('homepageFeatureI18n.Error404Component.lbl.BackToStartpage');
	});

	it('should navigate to home on routeToHome call', async () => {
		const navigateSpy = vi.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
		await component.routeToHome();
		expect(navigateSpy).toHaveBeenCalledWith(['/']);
	});

	it('should log error if navigation to home fails', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const navigateSpy = vi.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.reject('Navigation Error'));
		await component.routeToHome();
		// wait for the navigation promise rejection to be handled in the next microtask (component handles and logs it)
		expect(navigateSpy).toHaveBeenCalledWith(['/']);
		expect(consoleErrorSpy).toHaveBeenCalledWith('[Error404Component]', 'Error while navigating to home page', 'Navigation Error');
	});
});
