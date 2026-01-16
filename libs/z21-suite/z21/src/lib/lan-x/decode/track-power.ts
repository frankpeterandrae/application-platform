/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LanXCommandKey } from '../../constants';
import type { Z21Event } from '../../z21/event-types';

/**
 * Decodes track power on/off commands into Z21Event entries.
 *
 * @param command - The LAN X command key.
 * @param data - The X-BUS dataset bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXTrackPower(command: LanXCommandKey, data: Uint8Array): Z21Event[] {
	if (command === 'LAN_X_BC_TRACK_POWER_OFF') {
		return [{ type: 'event.track.power', on: false }];
	} else if (command === 'LAN_X_BC_TRACK_POWER_ON') {
		return [{ type: 'event.track.power', on: true }];
	}

	return [];
}
