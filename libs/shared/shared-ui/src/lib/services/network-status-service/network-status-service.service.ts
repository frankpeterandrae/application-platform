/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { fromEvent, map, merge, of } from 'rxjs';

/**
 * Injectable service to monitor network status changes.
 * Provides an observable `status$` that emits `true` when online and `false` when offline.
 */
@Injectable({
	providedIn: 'root'
})
export class NetworkStatusServiceService {
	/**
	 * Observable that emits the current network status.
	 * Emits `true` when the network is online and `false` when offline.
	 */
	public readonly status$ = merge(
		fromEvent(window, 'offline').pipe(map(() => false)),
		fromEvent(window, 'online').pipe(map(() => true)),
		of(navigator.onLine)
	);
}
