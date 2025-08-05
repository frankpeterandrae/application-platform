/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { environment } from '@angular-apps/config';

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
			this.router.navigate(['/404']);
			return false;
		}
	}
}
