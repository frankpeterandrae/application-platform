/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21SystemState } from '@application-platform/z21-shared';

/**
 * Decodes a 16-byte system state payload into typed fields.
 *
 * @param state - Raw system state bytes from a Z21 dataset.
 * @returns Parsed Z21SystemState structure.
 */
export function decodeSystemState(state: Uint8Array): Z21SystemState {
	const b = Buffer.from(state);
	return {
		mainCurrent_mA: b.readInt16LE(0),
		progCurrent_mA: b.readInt16LE(2),
		filteredMainCurrent_mA: b.readInt16LE(4),
		temperature_C: b.readInt16LE(6),
		supplyVoltage_mV: b.readUInt16LE(8),
		vccVoltage_mV: b.readUInt16LE(10),
		centralState: b.readUInt8(12),
		centralStateEx: b.readUInt8(13),
		capabilities: b.readUInt8(15)
	};
}
