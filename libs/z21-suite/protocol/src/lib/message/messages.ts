/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CLIENT_TO_SERVER_TYPES, SERVER_TO_CLIENT_TYPES, type ClientToServer, type ServerToClient } from './message-types';

/**
 * Current protocol version used for client-server communication.
 * Sent to clients during session handshake to verify compatibility.
 */
export const PROTOCOL_VERSION = '1.0.0' as const;

/**
 * Helper type for objects with a type property
 */
type MessageWithType = { type: unknown };

/**
 * Type guard that validates whether an unknown value is a valid ClientToServer message.
 *
 * Checks that:
 * - The value is a non-null object
 * - It has a 'type' property that is a string
 * - The type matches one of the supported client-to-server message types
 *
 * This function automatically supports new message types added to the ClientToServer union.
 *
 * @param msg - The value to validate
 * @returns True if msg is a valid ClientToServer message, false otherwise
 */
export function isClientToServerMessage(msg: unknown): msg is ClientToServer {
	return (
		typeof msg === 'object' &&
		msg !== null &&
		'type' in msg &&
		typeof (msg as MessageWithType).type === 'string' &&
		Boolean((CLIENT_TO_SERVER_TYPES as Record<string, true>)[(msg as MessageWithType).type as string])
	);
}

/**
 * Type guard that validates whether an unknown value is a valid ServerToClient message.
 *
 * Checks that:
 * - The value is a non-null object
 * - It has a 'type' property that is a string
 * - The type matches one of the supported server-to-client message types
 *
 * This function automatically supports new message types added to the ServerToClient union.
 *
 * @param msg - The value to validate
 * @returns True if msg is a valid ServerToClient message, false otherwise
 */
export function isServerToClientMessage(msg: unknown): msg is ServerToClient {
	return (
		typeof msg === 'object' &&
		msg !== null &&
		'type' in msg &&
		typeof (msg as MessageWithType).type === 'string' &&
		Boolean((SERVER_TO_CLIENT_TYPES as Record<string, true>)[(msg as MessageWithType).type as string])
	);
}
