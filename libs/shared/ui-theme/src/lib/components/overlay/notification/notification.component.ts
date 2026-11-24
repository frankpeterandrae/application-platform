/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NotificationPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/** Displays a status message with an optional automatic fade-out. */
@Component({
	selector: 'theme-notification',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { '[attr.data-position]': 'position()' },
	templateUrl: './notification.component.html',
	styleUrl: './notification.component.scss'
})
export class NotificationComponent {
	/** Text to display in the notification. */
	public readonly message = input.required<string>();

	/** Visual tone and screen reader priority. */
	public readonly tone = input<'info' | 'success' | 'error'>('info');

	/** Position of the notification in the viewport. */
	public readonly position = input<NotificationPosition>('top-right');

	/** Time before the message fades out. Use null to keep it visible. */
	public readonly durationMs = input<number | null>(3000);

	protected readonly displayDuration = computed(() => (this.tone() === 'error' ? null : this.durationMs()));
}
