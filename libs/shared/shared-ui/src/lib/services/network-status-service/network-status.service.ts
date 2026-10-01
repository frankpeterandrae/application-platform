/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { fromEvent, map, merge, of } from 'rxjs';

/**
 * Monitors browser network status changes.
 *
 * `status$` emits `true` when the browser is online and `false` when offline.
 */
@Injectable({
	providedIn: 'root'
})
export class NetworkStatusService {
	/**
	 * Emits the current browser network status and subsequent online/offline changes.
	 */
	public readonly status$ = merge(
		fromEvent(globalThis, 'offline').pipe(map(() => false)),
		fromEvent(globalThis, 'online').pipe(map(() => true)),
		of(navigator.onLine)
	);
}
