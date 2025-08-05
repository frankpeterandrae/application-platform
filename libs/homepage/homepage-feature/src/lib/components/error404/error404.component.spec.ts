/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Error404Component } from './error404.component';
import { setupTestingModule } from '../../../test-setup';
import { LOGGER_SOURCE } from '@angular-apps/shared-ui';

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
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		expect(component.backToStart()).toBe('feature.Error404Component.lbl.BackToStartpage');
	}));

	it('should navigate to home on routeToHome call', () => {
		const navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
		component.routeToHome();
		expect(navigateSpy).toHaveBeenCalledWith(['/']);
	});

	it('should log error if navigation to home fails', async () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.reject('Navigation Error'));
		await component.routeToHome();
		expect(navigateSpy).toHaveBeenCalledWith(['/']);
		expect(consoleErrorSpy).toHaveBeenCalledWith('[Error404Component]', 'Error while navigating to home page', 'Navigation Error');
	});
});
