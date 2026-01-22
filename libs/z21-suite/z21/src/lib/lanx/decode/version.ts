/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';
/**
 * Convert XBus Version to standard version number
 * e.g 0x30 = V3.0, 0x36 = V3.6, 0x40 = V4.0
 * @param xBusVersion
 */
function xBusVersionToVersion(xBusVersion: number): number {
	const major = (xBusVersion & 0xf0) >> 4;
	const minor = xBusVersion & 0x0f;
	if (major === 0 && minor === 0) {
		return 0; // Unknown version
	}
	return Number.parseFloat(`${major}.${minor}`);
}

/** Decode LAN X Version Payload
 * Payload structure:
 * Byte 0: XBus Version
 * Byte 1: CMDs ID
 */
export function decodeLanXVersionPayload(payload: Uint8Array): Extract<Z21Event, { event: 'system.event.x.bus.version' }>[] {
	const raw = Array.from(payload);
	const xBusVersion = payload[0];
	const cmdsId = payload[1];

	const version = xBusVersionToVersion(xBusVersion);

	return [
		{
			event: 'system.event.x.bus.version',
			payload: {
				raw,
				xBusVersion,
				xBusVersionString: version > 0 ? `V${version.toFixed(1)}` : 'Unknown',
				cmdsId
			}
		}
	];
}
