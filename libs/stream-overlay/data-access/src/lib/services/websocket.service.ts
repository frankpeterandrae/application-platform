/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, signal } from '@angular/core';
import { filter, map, Observable, Subject } from 'rxjs';

import { WebSocketMessage } from '../model/websocket-message';

/**
 * Manages the WebSocket connection to the backend.
 *
 * The service tracks the connection state, sends event messages and exposes
 * incoming event payloads as observables.
 */
@Injectable({
	providedIn: 'root'
})
export class WebSocketService {
	private readonly socket = new WebSocket('ws://localhost:3000/ws');

	private readonly messageSubject = new Subject<WebSocketMessage<unknown>>();
	private readonly connectedState = signal(false);

	public readonly connected = this.connectedState.asReadonly();

	constructor() {
		this.socket.addEventListener('open', () => {
			this.connectedState.set(true);
		});

		this.socket.addEventListener('close', () => {
			this.connectedState.set(false);
		});

		this.socket.addEventListener('message', ({ data }) => {
			this.handleMessage(data);
		});
	}

	/**
	 * Sends an event message when the WebSocket connection is open.
	 *
	 * Messages are discarded while the connection is not open.
	 *
	 * @param event The event name to send.
	 * @param data The event payload.
	 * @template T The type of the payload.
	 */
	public send<T>(event: string, data: T): void {
		if (this.socket.readyState !== WebSocket.OPEN) {
			return;
		}

		this.socket.send(
			JSON.stringify({
				event,
				data
			})
		);
	}

	/**
	 * Sends an event message immediately or once the WebSocket connection opens.
	 *
	 * @param event The event name to send.
	 * @param data The event payload.
	 * @template T The type of the payload.
	 */
	public sendWhenConnected<T>(event: string, data: T): void {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.send(event, data);

			return;
		}

		this.socket.addEventListener(
			'open',
			() => {
				this.send(event, data);
			},
			{
				once: true
			}
		);
	}

	/**
	 * Observes payloads received for a specific WebSocket event.
	 *
	 * @param event The event name to observe.
	 * @template T The expected payload type.
	 * @returns An observable emitting payloads for the specified event.
	 */
	public on<T>(event: string): Observable<T> {
		return this.messageSubject.pipe(
			filter((message) => message.event === event),
			map((message) => message.data as T)
		);
	}

	private handleMessage(data: string): void {
		const message = JSON.parse(data) as WebSocketMessage<unknown>;

		this.messageSubject.next(message);
	}
}
