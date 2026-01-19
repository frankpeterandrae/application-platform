/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Bootstrap } from './bootstrap/bootstrap';
import { createProviders } from './bootstrap/providers';

const providers = createProviders();
const app = new Bootstrap(providers).start();

process.on('SIGINT', () => {
	try {
		app.stop();
	} catch (err) {
		// Intentionally swallow shutdown errors here so tests and the
		// process aren't terminated by exceptions thrown inside stop().
		// Individual tests that want to assert thrown errors may call the
		// captured handler directly and expect a throw from the spy.
	}
});

process.on('SIGTERM', () => {
	try {
		app.stop();
	} catch (err) {
		// Swallow shutdown errors to avoid uncaught exceptions during signal handling.
	}
});
