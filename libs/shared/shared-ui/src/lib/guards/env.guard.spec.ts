/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { APP_ENVIRONMENT } from '../config/app-environment';

import { EnvGuard } from './env.guard';

/**
 * Test suite for DataConnectionService.
 */
describe('EnvGuard', () => {
	let guard: EnvGuard;
	let router: Router;

	const environment = {
		production: false,
		baseUrl: ''
	};

	beforeEach(async () => {
		environment.production = false;

		await setupTestingModule({
			providers: [
				EnvGuard,
				{
					provide: APP_ENVIRONMENT,
					useValue: environment
				},
				{
					provide: Router,
					useValue: {
						navigate: vi.fn()
					}
				}
			]
		});

		guard = TestBed.inject(EnvGuard);
		router = TestBed.inject(Router);
	});

	it('should allow activation if not in production', () => {
		expect(guard.canActivate()).toBeTruthy();
	});

	it('should redirect to 404 if in production', () => {
		environment.production = true;

		const navigateSpy = vi.spyOn(router, 'navigate');

		expect(guard.canActivate()).toBeFalsy();
		expect(navigateSpy).toHaveBeenCalledWith(['/404']);
	});
});
