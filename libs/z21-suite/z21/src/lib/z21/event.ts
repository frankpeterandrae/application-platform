/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21SystemState } from '@application-platform/z21-shared';

import type { Z21Dataset } from '../codec/codec-types';
import { type LanXCommandKey } from '../constants';
import { decodeLanXCommand } from '../lan-x/decode/decoder';
import { resolveLanXCommand } from '../lan-x/dispatch';

import { CentralStatus, CentralStatusEx, type DerivedTrackFlags, type Z21Event } from './event-types';

/**
 * Converts a decoded Z21 dataset into one or more higher-level events.
 * - system.state datasets are decoded into Z21SystemState payloads.
 * - X-Bus datasets are inspected by xHeader to emit specific events, else event.unknown.x.bus.
 *
 * @param ds - The Z21 dataset to convert.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function dataToEvent(ds: Z21Dataset): Z21Event[] {
	if (ds.kind === 'ds.system.state') {
		return [{ type: 'event.z21.status', payload: decodeSystemState(ds.state) }];
	}

	if (ds.kind !== 'ds.x.bus') {
		return [];
	}

	const b = ds.data;
	const xHeader = b[0];

	const command: LanXCommandKey = resolveLanXCommand(b);
	const decoded = decodeLanXCommand(command, b);

	if (decoded.length > 0) {
		return decoded;
	}

	// Specific decoders for known X-Bus payloads
	return [{ type: 'event.unknown.x.bus', xHeader, bytes: Array.from(b) }];
}

/**
 * Decodes a 16-byte system state payload into typed fields.
 *
 * @param state - Raw system state bytes from a Z21 dataset.
 * @returns Parsed Z21SystemState structure.
 */
function decodeSystemState(state: Uint8Array): Z21SystemState {
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

/**
 * Derives human-friendly track flags from system state bitfields.
 *
 * @param sysState - Central state and extended state bytes.
 * @returns DerivedTrackFlags indicating power, emergency stop, short, programming mode.
 */
export function deriveTrackFlagsFromSystemState(sysState: { centralState: number; centralStateEx: number }): DerivedTrackFlags {
	const cs = sysState.centralState;
	const csEx = sysState.centralStateEx;

	const emergencyStop = (cs & CentralStatus.EmergencyStop) !== 0;
	const short = (cs & CentralStatus.ShortCircuit) !== 0;
	const trackVoltageOff = (cs & CentralStatus.TrackVoltageOff) !== 0;
	const powerOn = !trackVoltageOff;
	const programmingMode = (cs & CentralStatus.ProgrammingModeActive) !== 0;

	const highTemperature = (csEx & CentralStatusEx.HighTemperature) !== 0;
	const powerLost = (csEx & CentralStatusEx.PowerLost) !== 0;
	const shortCircuitExternal = (csEx & CentralStatusEx.ShortCircuitExternal) !== 0;
	const shortCircuitInternal = (csEx & CentralStatusEx.ShortCircuitInternal) !== 0;
	const cseRCN2130Mode = (csEx & CentralStatusEx.CseRCN2130Mode) !== 0;

	return {
		powerOn,
		emergencyStop,
		short,
		programmingMode,
		highTemperature,
		powerLost,
		shortCircuitExternal,
		shortCircuitInternal,
		cseRCN2130Mode
	};
}
