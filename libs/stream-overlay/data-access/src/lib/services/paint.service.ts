/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable, signal } from '@angular/core';
import { Paint } from '@application-platform/paint';
import { PaintEvent } from '@application-platform/paint-data-access/client';

import { WebSocketService } from './websocket.service';

/**
 * Manages the current paint selection for the stream overlay.
 *
 * The service receives paint changes through WebSocketService, exposes the
 * current paint as a readonly signal and sends new paint selections to the
 * backend.
 */
@Injectable({
	providedIn: 'root'
})
export class PaintService {
	private readonly webSocketService = inject(WebSocketService);
	private readonly currentPaintState = signal<Paint | undefined>(undefined);

	public readonly currentPaint = this.currentPaintState.asReadonly();

	constructor() {
		this.webSocketService.on<Paint | undefined>(PaintEvent.Changed).subscribe((paint) => {
			this.currentPaintState.set(paint);
		});

		this.webSocketService.sendWhenConnected(PaintEvent.GetCurrent, undefined);
	}

	/**
	 * Sends a new paint selection to the backend.
	 *
	 * @param paint The paint to select.
	 */
	public selectPaint(paint: Paint): void {
		this.webSocketService.send(PaintEvent.Select, paint);
	}

	/**
	 * Clears the current paint selection and notifies the backend.
	 */
	public clearPaint(): void {
		this.webSocketService.send(PaintEvent.Clear, undefined);
		this.currentPaintState.set(undefined);
	}
}
