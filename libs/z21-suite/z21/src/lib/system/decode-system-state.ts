/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21SystemState } from '@application-platform/z21-shared';

/**
 * Decodes a 16-byte system state payload into typed fields.
 *
 * @param payload - Raw system state bytes from a Z21 dataset.
 * @returns Parsed Z21SystemState structure.
 */
export function decodeSystemState(payload: Uint8Array): Z21SystemState {
	const b = Buffer.from(payload);
	return {
		mainCurrentMa: b.readInt16LE(0),
		progCurrentMa: b.readInt16LE(2),
		filteredMainCurrentMa: b.readInt16LE(4),
		temperatureC: b.readInt16LE(6),
		supplyVoltageMv: b.readUInt16LE(8),
		vccVoltageMv: b.readUInt16LE(10),
		centralState: b.readUInt8(12),
		centralStateEx: b.readUInt8(13),
		capabilities: b.readUInt8(15)
	};
}
