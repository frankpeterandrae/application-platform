/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../event/event-types';

/** Decode LAN X Version Payload
 * Payload structure:
 * Byte 0: XBus Version
 * Byte 1: CMDs ID
 */
export function decodeLanXFirmwareVersionPayload(payload: Uint8Array): Extract<Z21Event, { type: 'event.firmware.version' }>[] {
	const raw = Array.from(payload);
	return [
		{
			type: 'event.firmware.version',
			raw,
			major: payload[0],
			minor: payload[1]
		}
	];
}
