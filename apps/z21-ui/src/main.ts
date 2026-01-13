/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

try {
	await bootstrapApplication(AppComponent, appConfig);
} catch (err) {
	// eslint-disable-next-line no-console
	console.error(err);
}
