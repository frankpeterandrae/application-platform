/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/** Announce complete messages once; never place animated text in a live region. */
export class Announcer {
	public constructor(private readonly region: HTMLElement) {
		region.setAttribute('role', 'status');
		region.setAttribute('aria-live', 'polite');
		region.setAttribute('aria-atomic', 'true');
	}
	public announce(message: string): void {
		this.region.textContent = message;
	}
	public clear(): void {
		this.region.textContent = '';
	}
}
