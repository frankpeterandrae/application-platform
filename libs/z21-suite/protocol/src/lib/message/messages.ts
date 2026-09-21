/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CLIENT_TO_SERVER_TYPES, SERVER_TO_CLIENT_TYPES, type ClientToServer, type ServerToClient } from './message-types';

/**
 * Current protocol version used for client-server communication.
 */
export const PROTOCOL_VERSION = '1.0.0' as const;

type MessageWithType = {
	type: unknown;
};

/**
 * Validates protocol message discriminators at runtime.
 *
 * The validator checks only whether a message declares a known `type`.
 * Payload structure and payload values are not validated.
 */
export class MessageValidator {
	/**
	 * Checks whether a value declares a known client-to-server message type.
	 *
	 * @param message - Value to inspect.
	 * @returns True when the value declares a supported client-to-server type.
	 */
	public static isClientToServerMessage(message: unknown): message is ClientToServer {
		return this.hasKnownType(message, CLIENT_TO_SERVER_TYPES);
	}

	/**
	 * Checks whether a value declares a known server-to-client message type.
	 *
	 * @param message - Value to inspect.
	 * @returns True when the value declares a supported server-to-client type.
	 */
	public static isServerToClientMessage(message: unknown): message is ServerToClient {
		return this.hasKnownType(message, SERVER_TO_CLIENT_TYPES);
	}

	private static hasKnownType(message: unknown, knownTypes: Readonly<Record<string, true>>): message is MessageWithType {
		if (typeof message !== 'object' || message === null || !('type' in message)) {
			return false;
		}

		const type = (message as MessageWithType).type;

		return typeof type === 'string' && knownTypes[type] === true;
	}
}
