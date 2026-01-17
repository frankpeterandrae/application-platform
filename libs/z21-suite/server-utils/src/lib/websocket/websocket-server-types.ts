/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { WebSocket as WsWebSocket } from 'ws';

/**
 * Callback signature for handling incoming WebSocket messages.
 * @param msg - The parsed message data (typically a string)
 * @param ws - The WebSocket connection that sent the message
 */
export type MessageHandler = (msg: unknown, ws: WsWebSocket) => void;

/**
 * Callback signature for handling WebSocket disconnections.
 * @param ws - The WebSocket connection that closed
 */
export type DisconnectHandler = (ws: WsWebSocket) => void;

/**
 * Callback signature for handling new WebSocket connections.
 * @param ws - The newly connected WebSocket
 */
export type ConnectHandler = (ws: WsWebSocket) => void;
