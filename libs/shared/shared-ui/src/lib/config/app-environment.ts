/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { InjectionToken } from '@angular/core';

/**
 * Runtime environment configuration used by shared UI services.
 */
export interface AppEnvironment {
	production: boolean;
	baseUrl: string;
}

/**
 * Injection token for the application environment configuration.
 */
export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
