/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// libs/stream-overlay/data-access/src/lib/services/stream-state.service.ts

import { inject, Injectable } from '@angular/core';
import { StreamEvent, StreamState } from '@application-platform/interfaces';
import { patchState, signalState } from '@ngrx/signals';

import { WebSocketService } from './websocket.service';

/**
 * Manages the transient stream state in the Angular application.
 *
 * The service synchronizes stream state changes with the backend and exposes
 * individual state properties as signals.
 */
@Injectable({
	providedIn: 'root'
})
export class StreamStateService {
	private readonly webSocketService = inject(WebSocketService);

	private readonly state = signalState<StreamState>({
		title: undefined,
		subtitle: undefined
	});

	public readonly title = this.state.title;
	public readonly subtitle = this.state.subtitle;

	constructor() {
		this.webSocketService.on<StreamState>(StreamEvent.StateChanged).subscribe((state) => {
			patchState(this.state, state);
		});

		this.webSocketService.sendWhenConnected(StreamEvent.GetState, undefined);
	}

	/**
	 * Updates the stream state and synchronizes it with the backend.
	 *
	 * @param state The new stream state to apply.
	 */
	public updateState(state: Partial<StreamState>): void {
		patchState(this.state, state);

		this.webSocketService.send(StreamEvent.UpdateState, state);
	}
}
