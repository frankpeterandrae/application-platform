/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage, PROTOCOL_VERSION, type ClientToServer, type ServerToClient } from '@application-platform/protocol';
import type { WsServer } from '@application-platform/server-utils';
import type { WebSocket as WsWebSocket } from 'ws';

/**
 * Callback signature for handling validated client messages.
 * @param msg - A validated client-to-server message
 */
export type MessageHandler = (msg: ClientToServer) => void;

/**
 * Callback signature for handling client disconnects.
 */
export type DisconnectHandler = () => void;

/**
 * AppWsServer is a thin wrapper around the underlying WsServer.
 * It handles connection lifecycle events, sends a session.ready handshake,
 * validates inbound messages against the protocol, and delegates send/broadcast.
 */
export class AppWsServer {
	/**
	 * Creates a new AppWsServer.
	 * @param wsServer - The underlying WebSocket server adapter
	 */
	constructor(private readonly wsServer: WsServer) {}

	/**
	 * Registers connection handlers.
	 * - On connect: sends a session.ready handshake and sets up message processing.
	 * - On message: parses JSON, validates via isClientToServerMessage, and forwards valid messages.
	 * - On disconnect: invokes the optional onDisconnect callback.
	 *
	 * @param onMessage - Handler invoked with validated ClientToServer messages
	 * @param onDisconnect - Optional handler invoked when the client disconnects
	 */
	public onConnection(onMessage: MessageHandler, onDisconnect?: DisconnectHandler): void {
		this.wsServer.onConnection(
			(data, ws) => {
				// Send welcome message on connection
				this.sendToClient(ws, {
					type: 'server.replay.session.ready',
					protocolVersion: PROTOCOL_VERSION,
					serverTime: new Date().toISOString()
				});

				// Parse and validate message
				// eslint-disable-next-line no-console
				console.log('[ws] raw', data);
				let msg: unknown;
				try {
					msg = JSON.parse(data as string);
				} catch {
					return;
				}
				if (!isClientToServerMessage(msg)) {
					// eslint-disable-next-line no-console
					console.log('[ws] rejected', msg);
					return;
				}
				// eslint-disable-next-line no-console
				console.log('[ws] accepted', msg.type);

				onMessage(msg);
			},
			() => {
				if (onDisconnect) {
					onDisconnect();
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
}
