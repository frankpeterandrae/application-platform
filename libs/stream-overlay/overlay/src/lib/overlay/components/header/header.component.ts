/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Component, inject } from '@angular/core';
import { StreamStateService } from '@application-platform/stream-overlay-data-access';

/**
 * The header component for the stream overlay.
 *
 * This component displays the header of the stream overlay, providing a clear
 * and visually appealing header for the overlay interface.
 */
@Component({
	selector: 'stream-overlay-header',
	standalone: true,
	templateUrl: './header.component.html',
	styleUrl: './header.component.scss'
})
export class HeaderComponent {
	private readonly streamStateService = inject(StreamStateService);

	protected readonly title = this.streamStateService.title;
	protected readonly subtitle = this.streamStateService.subtitle;
}
