/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import type { CanActivate } from '@angular/router';
import { Router } from '@angular/router';

import { APP_ENVIRONMENT } from '../config/app-environment';

/**
 * Guard to check if the environment is in production mode.
 * If not in production, allows activation. Otherwise, redirects to a 404 page.
 */
@Injectable({
	providedIn: 'root'
})
export class EnvGuard implements CanActivate {
	private readonly environment = inject(APP_ENVIRONMENT);
	private readonly router = inject(Router);

	/**
	 * Determines if the route can be activated.
	 * @returns {boolean} True if not in production, otherwise false.
	 */
	public canActivate(): boolean {
		if (this.environment.production) {
			void this.router.navigate(['/404']);
			return false;
		} else {
			return true;
		}
	}
}
