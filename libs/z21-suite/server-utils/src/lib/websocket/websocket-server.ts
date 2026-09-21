/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type * as http from 'node:http';

import { WebSocket, WebSocketServer, type RawData } from 'ws';

import type { AliveWebSocket, ConnectHandler, DisconnectHandler, MessageHandler } from './websocket-server-types';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Manages WebSocket connections, messaging and connection health.
 */
export class WsServer {
	private readonly wss: WebSocketServer;
	private heartbeatTimer?: NodeJS.Timeout;

	/**
	 * Creates a WebSocket server attached to an existing HTTP server.
	 *
	 * @param server - HTTP server used by the WebSocket server.
	 */
	constructor(server: http.Server) {
		this.wss = new WebSocketServer({ server });
		this.startHeartbeat();
	}

	/**
	 * Registers handlers for WebSocket connection events.
	 *
	 * @param onMessage - Handler invoked for incoming messages.
	 * @param onDisconnect - Optional handler invoked when a client disconnects.
	 * @param onConnect - Optional handler invoked when a client connects.
	 */
	public onConnection(onMessage: MessageHandler, onDisconnect?: DisconnectHandler, onConnect?: ConnectHandler): void {
		this.wss.on('connection', (ws) => {
			const aliveWs = ws as AliveWebSocket;

			aliveWs.isAlive = true;

			aliveWs.on('pong', () => {
				aliveWs.isAlive = true;
			});

			onConnect?.(ws);

			ws.on('message', (data: RawData) => {
				onMessage(this.toMessageString(data), ws);
			});

			ws.on('close', () => {
				onDisconnect?.(ws);
			});
		});
	}

	/**
	 * Sends a message to a WebSocket client.
	 *
	 * Strings are sent unchanged; all other values are serialized as JSON.
	 *
	 * @param ws - Target WebSocket connection.
	 * @param message - Message to send.
	 */
	public send(ws: WebSocket, message: unknown): void {
		ws.send(this.serializeMessage(message));
	}

	/**
	 * Broadcasts a message to all connected clients whose connection is open.
	 *
	 * @param message - Message to broadcast.
	 */
	public broadcast(message: unknown): void {
		const serializedMessage = this.serializeMessage(message);

		for (const client of this.wss.clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(serializedMessage);
			}
		}
	}

	/**
	 * Stops heartbeat monitoring and closes the WebSocket server.
	 */
	public close(): void {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = undefined;
		}

		this.wss.close();
	}

	private toMessageString(data: RawData): string {
		if (Array.isArray(data)) {
			return Buffer.concat(data).toString('utf8');
		}

		if (data instanceof ArrayBuffer) {
			return Buffer.from(data).toString('utf8');
		}

		return data.toString('utf8');
	}

	private serializeMessage(message: unknown): string {
		return typeof message === 'string' ? message : JSON.stringify(message);
	}

	private startHeartbeat(): void {
		this.heartbeatTimer = setInterval(() => this.checkConnections(), this.getHeartbeatInterval());

		this.heartbeatTimer.unref();
	}

	private checkConnections(): void {
		for (const client of this.wss.clients) {
			const aliveWs = client as AliveWebSocket;

			if (aliveWs.readyState !== WebSocket.OPEN) {
				continue;
			}

			if (!aliveWs.isAlive) {
				aliveWs.terminate();
				continue;
			}

			aliveWs.isAlive = false;
			aliveWs.ping();
		}
	}

	private getHeartbeatInterval(): number {
		const configuredInterval = Number(process.env['WS_HEARTBEAT_MS']);

		if (Number.isFinite(configuredInterval) && configuredInterval > 0) {
			return configuredInterval;
		}

		return DEFAULT_HEARTBEAT_INTERVAL_MS;
	}
}
