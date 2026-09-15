/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';
import { PaintEvent } from '@application-platform/paint-protocol';
import { WebSocket } from 'ws';

const STREAM_OVERLAY_URL = 'http://localhost:3000';
const STREAM_OVERLAY_WS_URL = 'ws://localhost:3000/ws';

/**
 * Loads paint-selector data from the stream-overlay server.
 */
export class StreamOverlayClient {
	private socket?: WebSocket;

	/**
	 * Gets the brands from the server
	 */
	public async getBrands(): Promise<PaintBrandDefinition[]> {
		return this.get<PaintBrandDefinition[]>('/api/paint-brands');
	}

	/**
	 * Gest the painst from the server
	 */
	public async getPaints(): Promise<Paint[]> {
		return this.get<Paint[]>('/api/paints');
	}

	/**
	 * Gets the recent paints form the server
	 */
	public async getRecentPaints(): Promise<PaintId[]> {
		return this.get<PaintId[]>('/api/recent');
	}

	/**
	 * Sends a paint selection event to the stream overlay server.
	 * @param paint The selected paint to send.
	 */
	public selectPaint(paint: Paint): void {
		this.send(PaintEvent.Select, paint);
	}

	/**
	 * Clears the paint selection on the stream overlay server.
	 */
	public clearPaint(): void {
		this.send(PaintEvent.Clear, undefined);
	}

	private send<T>(event: string, data: T): void {
		const socket = this.getSocket();

		if (socket.readyState === WebSocket.OPEN) {
			this.sendMessage(socket, event, data);
			return;
		}

		socket.once('open', () => {
			this.sendMessage(socket, event, data);
		});
	}

	private getSocket(): WebSocket {
		if (!this.socket || this.socket.readyState === WebSocket.CLOSING || this.socket.readyState === WebSocket.CLOSED) {
			this.socket = new WebSocket(STREAM_OVERLAY_WS_URL);

			this.socket.once('close', () => {
				this.socket = undefined;
			});

			this.socket.once('error', () => {
				this.socket = undefined;
			});
		}

		return this.socket;
	}

	private sendMessage<T>(socket: WebSocket, event: string, data: T): void {
		socket.send(
			JSON.stringify({
				event,
				data
			})
		);
	}

	private async get<T>(path: string): Promise<T> {
		const response = await fetch(`${STREAM_OVERLAY_URL}${path}`);

		if (!response.ok) {
			throw new Error(`Request failed: ${response.status} ${response.statusText}`);
		}

		return response.json() as Promise<T>;
	}
}
