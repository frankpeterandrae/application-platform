/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
	production: boolean;
	baseUrl: string;
}

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
