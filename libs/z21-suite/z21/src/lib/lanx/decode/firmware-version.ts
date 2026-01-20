/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../event/event-types';

/**
 * Decodes the LAN X Firmware Version payload.
 * @param payload - The raw payload bytes.
 *    - DB1: Major version
 *    - DB2: Minor version
 *      e.g., [0x01, 0x23] represents version 1.23
 * @returns Array of Z21Event entries with firmware version information.
 */
export function decodeLanXFirmwareVersionPayload(payload: Uint8Array): Extract<Z21Event, { type: 'event.z21.firmware.version' }>[] {
	const bcdToNumber = (value: number | undefined): number => {
		if (value === undefined) return 0;
		const high = (value >> 4) & 0x0f;
		const low = value & 0x0f;
		return high * 10 + low;
	};

	const major = bcdToNumber(payload[1]);
	const minor = bcdToNumber(payload[2]);
	const raw = Array.from(payload);
	return [
		{
			type: 'event.z21.firmware.version',
			raw,
			major,
			minor
		}
	];
}
