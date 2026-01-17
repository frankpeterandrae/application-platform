/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type LanXCommandKey } from '@application-platform/z21-shared';

import { type Z21Event } from '../../event/event-types';

import { decodeLanXLocoInfoPayload } from './loco-info';
import { decodeLanXStatusChangedPayload } from './status-changed';
import { decodeLanXTrackPowerPayload } from './track-power';
import { decodeLanXTurnoutInfoPayload } from './turnout-info';

export type LanXPayloadDecoder = (command: LanXCommandKey, payload: Uint8Array) => Z21Event[];

// Stepwise refactor: only LAN_X_LOCO_INFO is migrated for now.
const DECODERS: Partial<Record<LanXCommandKey, LanXPayloadDecoder>> = {
	LAN_X_LOCO_INFO: (_, payload) => decodeLanXLocoInfoPayload(payload),
	LAN_X_TURNOUT_INFO: (_, payload) => decodeLanXTurnoutInfoPayload(payload),
	LAN_X_BC_TRACK_POWER_ON: (cmd) => decodeLanXTrackPowerPayload(cmd),
	LAN_X_BC_TRACK_POWER_OFF: (cmd) => decodeLanXTrackPowerPayload(cmd),
	LAN_X_STATUS_CHANGED: (_, xBusBytes) => decodeLanXStatusChangedPayload(xBusBytes)
};

/**
 * Decodes the LAN X payload from raw X-Bus data.
 *
 * @param command - The LanXCommandKey to decode.
 * @param lanXBytes - Raw Lan X data bytes.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXPayload(command: LanXCommandKey, lanXBytes: Uint8Array): Z21Event[] {
	const fn = DECODERS[command];
	if (!fn) return [];
	const payload = lanXBytes.subarray(2); // [...payload] (nach LAN_X + header + cmd)
	return fn(command, payload);
}
