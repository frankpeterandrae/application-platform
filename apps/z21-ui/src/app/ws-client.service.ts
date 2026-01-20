/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, signal } from '@angular/core';
import { PROTOCOL_VERSION, type ClientToServer, type ServerToClient } from '@application-platform/protocol';

type Pending = {
	resolve: (msg: ServerToClient) => void;
	reject: (err: Error) => void;
	timer: number;
};

type MsgHandler = (msg: ServerToClient) => void;

/**
 * Service that manages a WebSocket connection to the server.
 * Provides methods to send messages, make requests, and handle incoming messages.
 */
@Injectable({
	providedIn: 'root'
})
export class WsClientService {
	public status = signal<'disconnected' | 'connected'>('disconnected');
	public lastMessage = signal<string>('');

	private ws?: WebSocket;
	private pending = new Map<string, Pending>();
	private handlers = new Set<MsgHandler>();

	constructor() {
		this.connect();
	}

	/**
	 * Registers a message handler that will be called for every incoming message.
	 * @param handler - The message handler function
	 * @returns A function to unregister the handler
	 */
	public onMessage(handler: MsgHandler): () => void {
		this.handlers.add(handler);
		return () => this.handlers.delete(handler);
	}

	private emit(msg: ServerToClient): void {
		for (const h of this.handlers) h(msg);
	}

	private connect(): void {
		const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
		this.ws = new WebSocket(`${proto}//${location.host}/ws`);

		this.ws.onopen = (): void => {
			this.status.set('connected');
			this.send({ type: 'server.command.session.hello', protocolVersion: PROTOCOL_VERSION, clientName: 'ui' });
		};

		this.ws.onclose = (): void => this.status.set('disconnected');

		this.ws.onmessage = (event): void => {
			const msg = JSON.parse(event.data) as ServerToClient;
			const existingMessages = JSON.parse(this.lastMessage() || '[]') as ServerToClient[];

			const allMessages = [...existingMessages, msg];

			this.lastMessage.set(JSON.stringify(allMessages, null, 2));
			this.handleIncoming(msg);
		};
	}

	/**
	 * Sends a message to the server.
	 * @param msg - The ClientToServer message to send
	 */
	public send(msg: ClientToServer): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			return;
		}
		this.ws.send(JSON.stringify(msg));
	}

	/**
	 * Sends a request message and returns a promise that resolves with the corresponding response.
	 * @param msgBuilder - Function that builds the request message given a unique requestId
	 * @param opts - Optional settings for the request
	 *  - timeoutMs: Duration in milliseconds to wait for a response before rejecting (default: 50000ms)
	 * @returns Promise that resolves with the response message of type TOk
	 */
	public request<TOk extends ServerToClient>(
		msgBuilder: (requestId: string) => ClientToServer,
		opts?: { timeoutMs?: number }
	): Promise<TOk> {
		const requestId = crypto.randomUUID();
		const timeoutMs = opts?.timeoutMs ?? 50000;

		return new Promise<TOk>((resolve, reject) => {
			const timer = window.setTimeout(() => {
				this.pending.delete(requestId);
				reject(new Error('Request timed out'));
			}, timeoutMs);

			this.pending.set(requestId, {
				resolve: (m) => resolve(m as TOk),
				reject,
				timer
			});

			this.send(msgBuilder(requestId));
		});
	}

	/**
	 * Handles incoming messages from the server.
	 * @param msg - The incoming ServerToClient message
	 */
	private handleIncoming(msg: ServerToClient): void {
		this.emit(msg);

		if (msg.type !== 'programming.replay.cv.result' && msg.type !== 'programming.replay.cv.nack') {
			return;
		}

		const requestId = msg.payload.requestId;
		const pending = this.pending.get(requestId);
		if (!pending) {
			return;
		}

		window.clearTimeout(pending.timer);
		this.pending.delete(requestId);

		if (msg.type === 'programming.replay.cv.result') {
			pending.resolve(msg);
		} else {
			pending.reject(new Error(msg.payload.error));
		}
	}
}
