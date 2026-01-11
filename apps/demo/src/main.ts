/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Application entry point for the demo app.
 * Starts the Angular application and surfaces startup errors.
 */
async function main(): Promise<void> {
	try {
		await bootstrapApplication(AppComponent, appConfig);
	} catch (err: unknown) {
		/* eslint-disable no-console */
		// Log safely and re-throw on the next tick so the error is not silently swallowed
		if (err instanceof Error) {
			console.error('Bootstrap failed:', err);
		} else {
			console.error('Bootstrap failed:', String(err));
		}
		/* eslint-enable no-console */
		setTimeout(() => {
			throw err;
		}, 0);
	}
}

void main();
