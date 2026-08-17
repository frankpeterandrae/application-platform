/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Represents an event message exchanged through the WebSocket connection.
 *
 * @template T The type of the message payload.
 */
export interface WebSocketMessage<T> {
	event: string;
	data: T;
}
