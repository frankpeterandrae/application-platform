/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, XHeader, type LanXCommandKey } from '@application-platform/z21-shared';

/**
 * Decodes the LAN X command from raw X-Bus data.
 *
 * @param xHeader - The X-Bus header value.
 * @param data - Raw X-Bus data bytes.
 * @returns The identified LanXCommandKey, or 'LAN_X_UNKNOWN_COMMAND' if unrecognized.
 */
export function resolveLanXCommand(xHeader: number, data: Uint8Array): LanXCommandKey {
	const xBusCmd = data.length > 0 ? data[0] : undefined;
	const len = data.length;

	// Special handling for TURNOUT_INFO which has two variants based on length
	if (xHeader === XHeader.TURNOUT_INFO) {
		// If no payload, we can't determine the command
		if (len === 0) {
			return 'LAN_X_UNKNOWN_COMMAND';
		}
		// Single-byte payload => request for turnout info
		if (len === 1) {
			return 'LAN_X_GET_TURNOUT_INFO';
		}
		// Two or more bytes => actual turnout info
		return 'LAN_X_TURNOUT_INFO';
	}

	for (const [key, cmd] of Object.entries(LAN_X_COMMANDS)) {
		if (cmd.xHeader !== xHeader) {
			continue;
		}

		// If the command defines an xBusCmd, it must match. Otherwise the header alone is sufficient.
		if (!('xBusCmd' in cmd) || xBusCmd === cmd.xBusCmd) {
			return key as LanXCommandKey;
		}
	}

	return 'LAN_X_UNKNOWN_COMMAND';
}
