/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ClientToServer } from './message-types';

export const PROTOCOL_VERSION = '1.0.0' as const;

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
	if (!msg || typeof msg !== 'object') {
		return false;
	}
	const msgType = (msg as Record<string, unknown>)['type'];
	return (
		typeof msgType === 'string' &&
		(msgType === 'server.command.session.hello' ||
			msgType === 'system.command.trackpower.set' ||
			msgType === 'loco.command.drive' ||
			msgType === 'loco.command.eStop' ||
			msgType === 'loco.command.function.set' ||
			msgType === 'loco.command.function.toggle' ||
			msgType === 'switching.command.turnout.set')
	);
}
