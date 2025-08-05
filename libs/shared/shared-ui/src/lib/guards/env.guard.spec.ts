/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EnvGuard } from './env.guard';
import { environment } from '@angular-apps/config';

/**
 * Test suite for DataConnectionService.
 */
describe('EnvGuard', () => {
	let guard: EnvGuard;
	let router: Router;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [EnvGuard, { provide: Router, useValue: { navigate: jest.fn() } }]
		});
		guard = TestBed.inject(EnvGuard);
		router = TestBed.inject(Router);
	});

	it('should allow activation if not in production', () => {
		Object.defineProperty(environment, 'production', { value: false });
		expect(guard.canActivate()).toBeTruthy();
	});

	it('should redirect to 404 if in production', () => {
		Object.defineProperty(environment, 'production', { value: true });
		const navigateSpy = jest.spyOn(router, 'navigate');
		expect(guard.canActivate()).toBeFalsy();
		expect(navigateSpy).toHaveBeenCalledWith(['/404']);
	});
});
