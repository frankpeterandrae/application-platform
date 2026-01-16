import type { LanXCommandKey } from '../constants';
import { LAN_X_COMMANDS, XBusHeader } from '../constants';

/**
 * Decodes the LAN X command from raw X-Bus data.
 *
 * @param data - Raw X-Bus data bytes.
 * @returns The identified LanXCommandKey, or 'LAN_X_UNKNOWN_COMMAND' if unrecognized.
 */
export function resolveLanXCommand(data: Uint8Array): LanXCommandKey {
	const xHeader = data[0];
	const xBusCmd = data.length > 1 ? data[1] : undefined;
	const len = data.length;

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
