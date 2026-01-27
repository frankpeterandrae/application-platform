/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { BroadcastflagEvent, Broadcastflags } from '@application-platform/z21-shared';

import { Z21BroadcastFlag } from '../constants';

/**
 * Decodes broadcast flags from the given numeric bitmask.
 * @param flagsValue - 32-bit numeric bitmask containing the broadcast flags
 * @returns BroadcastflagEvent with decoded boolean flags and raw bytes
 */
export function decodeBroadcstflags(flagsValue: number): BroadcastflagEvent {
	// Normalize to unsigned 32-bit
	const v = flagsValue >>> 0;
	const buf = Buffer.alloc(4);
	buf.writeUInt32LE(v, 0);

	const flags: Broadcastflags = {
		none: v === Z21BroadcastFlag.NONE,
		basic: Boolean(v & Z21BroadcastFlag.BASIC),
		rMbus: Boolean(v & Z21BroadcastFlag.R_MBUS),
		railcom: Boolean(v & Z21BroadcastFlag.RAILCOM),
		systemState: Boolean(v & Z21BroadcastFlag.SYSTEM_STATE),
		changedLocoInfo: Boolean(v & Z21BroadcastFlag.CHANGED_LOCO_INFO),
		locoNetWithoutLocoAndSwitches: Boolean(v & Z21BroadcastFlag.LOCO_NET_WITHOUT_LOCO_AND_SWITCHES),
		locoNetWithLocoAndSwitches: Boolean(v & Z21BroadcastFlag.LOCO_NET_WITH_LOCO_AND_SWITCHES),
		locoNetDetector: Boolean(v & Z21BroadcastFlag.LOCO_NET_DETECTOR),
		railcomDatachanged: Boolean(v & Z21BroadcastFlag.RAILCOM_DATACHANGED)
	};

	return {
		event: 'system.event.broadcastflag',
		payload: {
			flags,
			raw: Array.from(buf)
		}
	};
}
