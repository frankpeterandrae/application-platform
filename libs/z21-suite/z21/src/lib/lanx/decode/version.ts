/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';
/**
 * Convert XBus Version to standard version number
 * e.g 0x30 = V3.0, 0x36 = V3.6, 0x40 = V4.0
 * @param xbusVersion
 */
function xbusVersionToVersion(xbusVersion: number): number {
	const major = (xbusVersion & 0xf0) >> 4;
	const minor = xbusVersion & 0x0f;
	if (major === 0 && minor === 0) {
		return 0; // Unknown version
	}
	return parseFloat(`${major}.${minor}`);
}

/** Decode LAN X Version Payload
 * Payload structure:
 * Byte 0: XBus Version
 * Byte 1: CMDs ID
 */
export function decodeLanXVersionPayload(payload: Uint8Array): Extract<Z21Event, { type: 'event.x.bus.version' }>[] {
	const raw = Array.from(payload);
	const xbusVersion = payload[0];
	const cmdsId = payload[1];

	const version = xbusVersionToVersion(xbusVersion);

	return [
		{
			type: 'event.x.bus.version',
			raw,
			xbusVersion,
			xBusVersionString: version > 0 ? `V${version.toFixed(1)}` : 'Unknown',
			cmdsId
		}
	];
}
