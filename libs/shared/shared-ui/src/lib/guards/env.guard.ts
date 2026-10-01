/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { type CanActivate, Router } from '@angular/router';

import { APP_ENVIRONMENT } from '../config/app-environment';

/**
 * Prevents routes from being activated in production environments.
 */
@Injectable({
	providedIn: 'root'
})
export class EnvGuard implements CanActivate {
	private readonly environment = inject(APP_ENVIRONMENT);
	private readonly router = inject(Router);

	/**
	 * Allows activation outside production and redirects to the 404 route otherwise.
	 */
	public canActivate(): boolean {
		if (!this.environment.production) {
			return true;
		}

		void this.router.navigate(['/404']);
		return false;
	}
}
