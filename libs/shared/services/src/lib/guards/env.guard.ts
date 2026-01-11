/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivate } from '@angular/router';
import { environment } from '@application-platform/config';

/**
 * Guard to check if the environment is in production mode.
 * If not in production, allows activation. Otherwise, redirects to a 404 page.
 */
@Injectable({
	providedIn: 'root'
})
export class EnvGuard implements CanActivate {
	private readonly router = inject(Router);

	/**
	 * Determines if the route can be activated.
	 * @returns {boolean} True if not in production, otherwise false.
	 */
	public canActivate(): boolean {
		if (!environment.production) {
			return true;
		} else {
			void this.router.navigate(['/404']);
			return false;
		}
	}
}
