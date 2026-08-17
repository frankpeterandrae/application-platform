/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Root component of the stream overlay UI application.
 *
 * Provides the router outlet used to render the dashboard and overlay views.
 */
@Component({
	imports: [RouterModule],
	selector: 'stream-overlay-root',
	templateUrl: './app.html'
})
export class App {}
