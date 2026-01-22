/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HARDWARE_TYPE, type HardwareType, type Z21HwinfoEvent } from '@application-platform/z21-shared';

/**
 * Maps hardware type number to HardwareType enum or 'UNKNOWN'.
 * @param hwtype - Hardware type identifier
 * @returns Mapped HardwareType or 'UNKNOWN'
 */
function getHardwareType(hwtype: number): HardwareType | 'UNKNOWN' {
	const mapped = (HARDWARE_TYPE as Record<number, HardwareType>)[hwtype];
	return mapped ?? 'UNKNOWN';
}

/**
 * Decodes hardware information from type and firmware version BCD.
 * @param hwtype - Hardware type identifier
 * @param fwVersionBcd - Firmware version in BCD format
 * @returns Decoded hardware information event
 */
export function decodeHwInfo(hwtype: number, fwVersionBcd: number): Z21HwinfoEvent {
	const hardwareType: HardwareType | 'UNKNOWN' = getHardwareType(hwtype);

	const digits: number[] = [];
	let invalidBcd = false;
	for (let nibble = 0; nibble < 8; nibble++) {
		const value = (fwVersionBcd >> (nibble * 4)) & 0xf;
		if (value > 9) {
			invalidBcd = true;
		}
		digits.unshift(value > 9 ? 0 : value);
	}

	const versionNumber = Number.parseInt(digits.join(''), 10) || 0;
	const majorVersion = Math.floor(versionNumber / 100);
	const minorVersion = versionNumber % 100;

	return {
		event: 'system.event.hwinfo',
		payload: {
			hardwareType,
			majorVersion: invalidBcd ? 0 : majorVersion,
			minorVersion: invalidBcd ? 0 : minorVersion,
			raw: [hwtype, fwVersionBcd]
		}
	};
}
