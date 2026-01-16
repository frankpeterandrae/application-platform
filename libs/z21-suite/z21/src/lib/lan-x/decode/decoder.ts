/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LanXCommandKey } from '../../constants';
import type { Z21Event } from '../../z21/event-types';

import { decodeLanXLocoInfo } from './loco-info';
import { decodeLanXSystem } from './system';
import { decodeLanXTrackPower } from './track-power';
import { decodeLanXTurnoutInfo } from './turnout-info';

// Use a plain record to hold decoder functions.
const DECODERS: Partial<Record<LanXCommandKey, (data: Uint8Array) => Z21Event[]>> = {
	LAN_X_LOCO_INFO: decodeLanXLocoInfo,
	LAN_X_TURNOUT_INFO: decodeLanXTurnoutInfo,

	LAN_X_STATUS_CHANGED: (data: Uint8Array) => decodeLanXSystem('LAN_X_STATUS_CHANGED', data),

	LAN_X_BC_TRACK_POWER_OFF: (data: Uint8Array) => decodeLanXTrackPower('LAN_X_BC_TRACK_POWER_OFF', data),
	LAN_X_BC_TRACK_POWER_ON: (data: Uint8Array) => decodeLanXTrackPower('LAN_X_BC_TRACK_POWER_ON', data)
};

/**
 * Decodes the LAN X command from raw X-Bus data.
 *
 * @param command - The LanXCommandKey to decode.
 * @param data - Raw X-Bus data bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXCommand(command: LanXCommandKey, data: Uint8Array): Z21Event[] {
	const fn = DECODERS[command];
	if (typeof fn === 'function') {
		return fn(data);
	}
	return [];
}
