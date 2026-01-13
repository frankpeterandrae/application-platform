/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Dataset } from './codec';

export type Z21Event =
	| { type: 'event.track.power'; on: boolean }
	| { type: 'event.z21.status'; statusMask: number }
	| { type: 'event.loco.info'; addr: number; speedSteps: 14 | 28 | 128; speedRaw: number; forward: boolean }
	| { type: 'event.unknown.x.bus'; xHeader: number; bytes: number[] };

/**
 * Converts a decoded Z21 dataset into one or more higher-level events.
 * - system.state datasets are decoded into Z21SystemState payloads.
 * - X-Bus datasets are inspected by xHeader to emit specific events, else unknown.lan_x.
 *
 * @param ds - The Z21 dataset to convert.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function dataToEvent(ds: Z21Dataset): Z21Event[] {
	if (ds.kind !== 'ds.x.bus') {
		return [];
	}

	const b = ds.data;
	const xHeader = b[0];

	// Track power broadcasts :contentReference[oaicite:12]{index=12}
	if (xHeader === 0x61 && b.length >= 2) {
		const db0 = b[1];
		if (db0 === 0x00) {
			return [{ type: 'event.track.power', on: false }];
		}
		if (db0 === 0x01) {
			return [{ type: 'event.track.power', on: true }];
		}
	}

	// Status changed :contentReference[oaicite:13]{index=13}
	if (xHeader === 0x62 && b.length >= 3) {
		const db1 = b[1];
		if (db1 === 0x22) {
			return [{ type: 'event.z21.status', statusMask: b[2] }];
		}
	}

	// Loco info :contentReference[oaicite:14]{index=14}
	if (xHeader === 0xef && b.length >= 0) {
		const adrMsb = b[1] & 0x3f;
		const adrLsb = b[2];
		const addr = (adrMsb << 8) | adrLsb;

		const db2 = b[3];
		const speedStepCode = db2 & 0x07;
		const speedSteps: 14 | 28 | 128 = speedStepCode === 0 ? 14 : speedStepCode === 2 ? 28 : 128;

		const db3 = b[4];
		const forward = (db3 & 0x80) !== 0;
		const speedRaw = db3 & 0x7f;

		return [{ type: 'event.loco.info', addr, speedSteps, speedRaw, forward }];
	}
	return [{ type: 'event.unknown.x.bus', xHeader, bytes: Array.from(b) }];
}
