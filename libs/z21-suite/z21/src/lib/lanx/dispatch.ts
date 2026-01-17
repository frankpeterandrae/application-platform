/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, XBusHeader, type LanXCommandKey } from '@application-platform/z21-shared';

/**
 * Decodes the LAN X command from raw X-Bus data.
 *
 * @param data - Raw X-Bus data bytes.
 * @returns The identified LanXCommandKey, or 'LAN_X_UNKNOWN_COMMAND' if unrecognized.
 */
export function resolveLanXCommand(data: Uint8Array): LanXCommandKey {
	const xHeader = data[1];
	const xBusCmd = data.length > 2 ? data[2] : undefined;
	const len = data.length;

	// eslint-disable-next-line no-console
	console.log('Resolving LAN X command for header:', xHeader, 'cmd:', xBusCmd, 'length:', len);
	// Special handling for TURNOUT_INFO which has two variants based on length
	if (xHeader === XBusHeader.TURNOUT_INFO) {
		// TURNOUT_INFO requires at least 3 bytes (xHeader + 2 address bytes)
		if (len < 3) {
			return 'LAN_X_UNKNOWN_COMMAND';
		}
		if (len === 3) {
			return 'LAN_X_GET_TURNOUT_INFO';
		}
		if (len >= 4) {
			return 'LAN_X_TURNOUT_INFO';
		}
	}

	for (const [key, cmd] of Object.entries(LAN_X_COMMANDS)) {
		if (cmd.xBusHeader !== xHeader) {
			continue;
		}
		if ('xBusCmd' in cmd) {
			if (xBusCmd === cmd.xBusCmd) {
				return key as LanXCommandKey;
			}
		} else {
			return key as LanXCommandKey;
		}
	}

	return 'LAN_X_UNKNOWN_COMMAND';
}
