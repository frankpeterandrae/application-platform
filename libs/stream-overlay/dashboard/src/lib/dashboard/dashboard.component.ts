/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '@application-platform/shared/ui-theme';
import { WebSocketService } from '@application-platform/stream-overlay-data-access';

/**
 * Displays the stream overlay dashboard.
 *
 * The component exposes the current WebSocket connection state to the
 * template.
 */
@Component({
	selector: 'stream-dashboard-root',
	imports: [RouterLink, CardComponent],
	standalone: true,
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
	private readonly webSocketService = inject(WebSocketService);

	protected readonly connected = this.webSocketService.connected;
}
