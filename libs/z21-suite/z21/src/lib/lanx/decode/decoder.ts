/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LanXCommandKey, XHeader } from '@application-platform/z21-shared';

import type { Z21Event } from '../../event/event-types';
import { resolveLanXCommand } from '../dispatch';

import { decodeLanXLocoInfoPayload } from './loco-info';
import { decodeLanXStatusChangedPayload } from './status-changed';
import { decodeLanXStoppedPayload } from './stopped';
import { decodeLanXTrackPowerPayload } from './track-power';
import { decodeLanXTurnoutInfoPayload } from './turnout-info';
import { decodeLanXVersionPayload } from './version';

export type LanXPayloadDecoder = (command: LanXCommandKey, payload: Uint8Array) => Z21Event[];

// Stepwise refactor: only LAN_X_LOCO_INFO is migrated for now.
const DECODERS: Partial<Record<LanXCommandKey, LanXPayloadDecoder>> = {
	LAN_X_BC_PROGRAMMING_MODE: (cmd) => decodeLanXTrackPowerPayload(cmd),
	LAN_X_BC_STOPPED: () => decodeLanXStoppedPayload(),
	LAN_X_BC_TRACK_POWER_OFF: (cmd) => decodeLanXTrackPowerPayload(cmd),
	LAN_X_BC_TRACK_POWER_ON: (cmd) => decodeLanXTrackPowerPayload(cmd),
	LAN_X_BC_TRACK_SHORT_CIRCUIT: (cmd) => decodeLanXTrackPowerPayload(cmd),
	LAN_X_GET_VERSION_ANSWER: (_, payload) => decodeLanXVersionPayload(payload),
	LAN_X_LOCO_INFO: (_, payload) => decodeLanXLocoInfoPayload(payload),
	LAN_X_STATUS_CHANGED: (_, xBusBytes) => decodeLanXStatusChangedPayload(xBusBytes),
	LAN_X_TURNOUT_INFO: (_, payload) => decodeLanXTurnoutInfoPayload(payload)
};

/**
 * Decodes the LAN X payload from raw X-Bus data.
 *
 * @param xHeader - The X-Bus header value.
 * @param payload - Raw X-Bus data bytes.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXPayload(xHeader: XHeader, payload: Uint8Array): Z21Event[] {
	const command = resolveLanXCommand(xHeader, payload);
	const fn = DECODERS[command];
	if (!fn) return [];
	return fn(command, payload);
}
