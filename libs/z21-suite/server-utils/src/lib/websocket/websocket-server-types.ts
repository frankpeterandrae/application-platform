/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { WebSocket as WsWebSocket } from 'ws';

/**
 * Handles an incoming WebSocket message.
 */
export type MessageHandler = (message: string, ws: WsWebSocket) => void;

/**
 * Handles a closed WebSocket connection.
 */
export type DisconnectHandler = (ws: WsWebSocket) => void;

/**
 * Handles a newly established WebSocket connection.
 */
export type ConnectHandler = (ws: WsWebSocket) => void;

/**
 * WebSocket connection extended with heartbeat state.
 */
export type AliveWebSocket = WsWebSocket & {
	isAlive: boolean;
};
