/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage, PROTOCOL_VERSION, type ClientToServer, type ServerToClient } from '@application-platform/protocol';
import type { ConnectHandler, WsServer } from '@application-platform/server-utils';
import { Logger } from '@application-platform/z21-shared';
import type { WebSocket as WsWebSocket } from 'ws';

/**
 * Callback signature for handling validated client messages.
 * @param msg - A validated client-to-server message
 * @param ws - The WebSocket connection that sent the message
 */
export type MessageHandler = (msg: ClientToServer, ws: WsWebSocket) => void | Promise<void>;

/**
 * Callback signature for handling client disconnects.
 */
export type DisconnectHandler = (ws: WsWebSocket) => void;

/**
 * AppWsServer is a thin wrapper around the underlying WsServer.
 * It handles connection lifecycle events, sends a session.ready handshake,
 * validates inbound messages against the protocol, and delegates send/broadcast.
 */
export class AppWsServer {
	/**
	 * Creates a new AppWsServer.
	 * @param wsServer - The underlying WebSocket server adapter
	 * @param logger - Logger instance for logging events
	 */
	constructor(
		private readonly wsServer: WsServer,
		private readonly logger: Logger
	) {}

	/**
	 * Registers connection handlers.
	 * - On connect: sends a session.ready handshake and sets up message processing.
	 * - On message: parses JSON, validates via isClientToServerMessage, and forwards valid messages.
	 * - On disconnect: invokes the optional onDisconnect callback.
	 *
	 * @param onMessage - Handler invoked with validated ClientToServer messages
	 * @param onDisconnect - Optional handler invoked when the client disconnects
	 * @param onConnect - Optional handler invoked when the client connects
	 */
	public onConnection(onMessage: MessageHandler, onDisconnect?: DisconnectHandler, onConnect?: ConnectHandler): void {
		this.wsServer.onConnection(
			(data, ws) => {
				// Parse and validate message
				this.logger.debug('[ws] raw', { data });
				let msg: unknown;
				try {
					msg = JSON.parse(data as string);
				} catch {
					return;
				}
				if (!isClientToServerMessage(msg)) {
					this.logger.info('[ws] rejected', { msg, reason: 'invalid message' });
					return;
				}
				this.logger.info('[ws] accepted', { type: msg.type });

				void onMessage(msg, ws);
			},
			(ws) => {
				if (onDisconnect) {
					onDisconnect(ws);
				}
			},
			(ws) => {
				this.sendToClient(ws, {
					type: 'server.replay.session.ready',
					protocolVersion: PROTOCOL_VERSION,
					serverTime: new Date().toISOString()
				});

				if (onConnect) {
					onConnect(ws);
				}
			}
		);
	}

	/**
	 * Sends a protocol message to a specific client.
	 * @param ws - The client WebSocket instance
	 * @param msg - The server-to-client message to send
	 */
	public sendToClient(ws: WsWebSocket, msg: ServerToClient): void {
		this.wsServer.send(ws, msg);
	}

	/**
	 * Broadcasts a protocol message to all connected clients.
	 * @param msg - The server-to-client message to broadcast
	 */
	public broadcast(msg: ServerToClient): void {
		this.wsServer.broadcast(msg);
	}

	/**
	 * Closes the WebSocket server and all active connections.
	 */
	public close(): void {
		this.wsServer.close();
	}
}
