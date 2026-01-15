/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type * as http from 'node:http';

import { WebSocketServer, type WebSocket as WsWebSocket } from 'ws';

import type { ConnectHandler, DisconnectHandler, MessageHandler } from './websocket-server-types';

/**
 * WebSocket server wrapper that simplifies connection handling and messaging.
 *
 * Features:
 * - Attaches to an existing HTTP server
 * - Provides simplified message and disconnect event handling
 * - Supports sending messages to individual clients or broadcasting to all
 * - Automatically serializes objects to JSON for transmission
 */
export class WsServer {
	private readonly wss: WebSocketServer;

	/**
	 * Creates a new WebSocket server attached to an HTTP server.
	 * @param server - The HTTP server to attach the WebSocket server to
	 */
	constructor(server: http.Server) {
		this.wss = new WebSocketServer({ server });
	}

	/**
	 * Registers handlers for new WebSocket connections.
	 *
	 * For each new connection:
	 * - Converts incoming message data to string and forwards to onMessage
	 * - Invokes onDisconnect when the connection closes
	 *
	 * @param onMessage - Handler called for each message received from any client
	 * @param onDisconnect - Optional handler called when a client disconnects
	 * @param onConnect - Optional handler called when a client connects
	 */
	public onConnection(onMessage: MessageHandler, onDisconnect?: DisconnectHandler, onConnect?: ConnectHandler): void {
		this.wss.on('connection', (ws) => {
			if (onConnect) {
				onConnect(ws);
			}

			ws.on('message', (data) => {
				onMessage(data.toString(), ws);
			});

			ws.on('close', () => {
				if (onDisconnect) {
					onDisconnect(ws);
				}
			});
		});
	}

	/**
	 * Sends a message to a specific WebSocket client.
	 *
	 * - If msg is a string, sends it directly
	 * - Otherwise, serializes msg to JSON before sending
	 *
	 * @param ws - The WebSocket connection to send to
	 * @param msg - The message to send (string or object)
	 */
	public send(ws: WsWebSocket, msg: unknown): void {
		ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
	}

	/**
	 * Broadcasts a message to all connected clients with open connections.
	 *
	 * - If msg is a string, sends it directly
	 * - Otherwise, serializes msg to JSON before sending
	 * - Only sends to clients with readyState === 1 (OPEN)
	 *
	 * @param msg - The message to broadcast (string or object)
	 */
	public broadcast(msg: unknown): void {
		const s = typeof msg === 'string' ? msg : JSON.stringify(msg);
		for (const client of this.wss.clients) {
			if (client.readyState === 1) {
				client.send(s);
			}
		}
	}
}
