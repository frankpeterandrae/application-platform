/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LanXCommandKey } from '../../constants';
import type { Z21Event } from '../../z21/event-types';

/**
 * Decodes LAN X system commands into Z21Event arrays.
 *
 * @param command - The LanXCommandKey to decode.
 * @param data - The raw X-Bus data bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXSystem(command: LanXCommandKey, data: Uint8Array): Z21Event[] {
	if (command === 'LAN_X_STATUS_CHANGED') {
		if (data.length < 3) {
			return [];
		}
		return [{ type: 'event.system.state', statusMask: data[2] }];
	}

	return [];
}
