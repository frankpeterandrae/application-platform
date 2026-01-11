/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LOGGER_SOURCE } from '@application-platform/services';

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

	it('should set the sets the backToStartpage property with the translated string', fakeAsync(() => {
		component.ngOnInit();
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		expect(component.backToStartpage).toBe('Error404Component.lbl.BackToStartpage');
	}));

	it('should navigate to home on routeToHome call', () => {
		const navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
		void component.routeToHome();
		expect(navigateSpy).toHaveBeenCalledWith(['/']);
	});

	it('should log error if navigation to home fails', async () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.reject('Navigation Error'));
		void component.routeToHome();
		// wait for the navigation promise rejection to be handled in the next microtask
		await Promise.resolve();
		expect(navigateSpy).toHaveBeenCalledWith(['/']);
		expect(consoleErrorSpy).toHaveBeenCalledWith('[Error404Component]', 'Error while navigating to home page', 'Navigation Error');
	});
});
