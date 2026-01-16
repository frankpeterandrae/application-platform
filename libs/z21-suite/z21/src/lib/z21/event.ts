/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21SystemState } from '@application-platform/z21-shared';

import type { Z21Dataset } from '../codec/codec-types';
import {
	AddessByteMask,
	F13ToF20FunctionsByteMask,
	F21ToF28FunctionsByteMask,
	F29ToF31FunctionsByteMask,
	F5ToF12FunctionsByteMask,
	InfoByteMask,
	LAN_X_COMMANDS,
	LowFunctionsByteMask,
	SpeedByteMask,
	type LanXCommandKey
} from '../constants';

import { CentralStatus, CentralStatusEx, type DerivedTrackFlags, type Z21Event } from './event-types';

/**
 * Decodes a locomotive info X-BUS datset into a Z21Event array.
 *
 * @param b - The X-BUS dataset bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
function decodeLocoInfo(b: Uint8Array<ArrayBufferLike>): Z21Event[] {
	const adrMsb = b[1] & AddessByteMask.MSB;
	const adrLsb = b[2];
	const addr = (adrMsb << 8) + adrLsb;

	const db2 = b[3];
	const isMmLoco = (db2 & InfoByteMask.MM_LOCO) !== 0;
	const isOccupied = (db2 & InfoByteMask.OCCUPIED) !== 0;
	const speedStepCode = db2 & InfoByteMask.STEP;
	const speedSteps: 14 | 28 | 128 = speedStepCode === 0 ? 14 : speedStepCode === 2 ? 28 : 128;

	const db3 = b[4];
	const forward = (db3 & SpeedByteMask.DIRECTION_FORWARD) !== 0;
	const SPEED_VALUE_MASK = SpeedByteMask.VALUE;
	const speedRaw = db3 & SPEED_VALUE_MASK;
	// In the X-BUS protocol, a speed value of 1 encodes "emergency stop".
	// Regular speed steps are encoded as (step + 1), so:
	//   - 0 means "stop"
	//   - 1 means "emergency stop"
	//   - >= 2 represent increasing speed steps.
	const isEmergencyStop = speedRaw === 1;
	const speedStep = speedRaw <= 1 ? 0 : speedRaw - 1;

	const db4 = b[5];
	const isDoubleTraction = (db4 & LowFunctionsByteMask.D) !== 0;
	const isSmartsearch = (db4 & LowFunctionsByteMask.S) !== 0;

	const functionMap: Record<number, boolean> = {};
	functionMap[0] = (db4 & LowFunctionsByteMask.L) !== 0;
	functionMap[1] = (db4 & LowFunctionsByteMask.F1) !== 0;
	functionMap[2] = (db4 & LowFunctionsByteMask.F2) !== 0;
	functionMap[3] = (db4 & LowFunctionsByteMask.F3) !== 0;
	functionMap[4] = (db4 & LowFunctionsByteMask.F4) !== 0;

	if (b.length >= 7) {
		const db5 = b[6];
		functionMap[5] = (db5 & F5ToF12FunctionsByteMask.F5) !== 0;
		functionMap[6] = (db5 & F5ToF12FunctionsByteMask.F6) !== 0;
		functionMap[7] = (db5 & F5ToF12FunctionsByteMask.F7) !== 0;
		functionMap[8] = (db5 & F5ToF12FunctionsByteMask.F8) !== 0;
		functionMap[9] = (db5 & F5ToF12FunctionsByteMask.F9) !== 0;
		functionMap[10] = (db5 & F5ToF12FunctionsByteMask.F10) !== 0;
		functionMap[11] = (db5 & F5ToF12FunctionsByteMask.F11) !== 0;
		functionMap[12] = (db5 & F5ToF12FunctionsByteMask.F12) !== 0;
	}

	if (b.length >= 8) {
		const db6 = b[7];
		functionMap[13] = (db6 & F13ToF20FunctionsByteMask.F13) !== 0;
		functionMap[14] = (db6 & F13ToF20FunctionsByteMask.F14) !== 0;
		functionMap[15] = (db6 & F13ToF20FunctionsByteMask.F15) !== 0;
		functionMap[16] = (db6 & F13ToF20FunctionsByteMask.F16) !== 0;
		functionMap[17] = (db6 & F13ToF20FunctionsByteMask.F17) !== 0;
		functionMap[18] = (db6 & F13ToF20FunctionsByteMask.F18) !== 0;
		functionMap[19] = (db6 & F13ToF20FunctionsByteMask.F19) !== 0;
		functionMap[20] = (db6 & F13ToF20FunctionsByteMask.F20) !== 0;
	}

	if (b.length >= 9) {
		const db7 = b[8];
		functionMap[21] = (db7 & F21ToF28FunctionsByteMask.F21) !== 0;
		functionMap[22] = (db7 & F21ToF28FunctionsByteMask.F22) !== 0;
		functionMap[23] = (db7 & F21ToF28FunctionsByteMask.F23) !== 0;
		functionMap[24] = (db7 & F21ToF28FunctionsByteMask.F24) !== 0;
		functionMap[25] = (db7 & F21ToF28FunctionsByteMask.F25) !== 0;
		functionMap[26] = (db7 & F21ToF28FunctionsByteMask.F26) !== 0;
		functionMap[27] = (db7 & F21ToF28FunctionsByteMask.F27) !== 0;
		functionMap[28] = (db7 & F21ToF28FunctionsByteMask.F28) !== 0;
	}

	if (b.length >= 10) {
		const db8 = b[9];
		functionMap[29] = (db8 & F29ToF31FunctionsByteMask.F29) !== 0;
		functionMap[30] = (db8 & F29ToF31FunctionsByteMask.F30) !== 0;
		functionMap[31] = (db8 & F29ToF31FunctionsByteMask.F31) !== 0;
	}

	return [
		{
			type: 'event.loco.info',
			addr,
			isMmLoco,
			isOccupied,
			isDoubleTraction,
			isSmartsearch,
			speedSteps,
			speed: speedStep,
			emergencyStop: isEmergencyStop,
			forward,
			functionMap
		}
	];
}

/**
 * Decodes a turnout info X-BUS dataset into a Z21Event array.
 *
 * @param b - The X-BUS dataset bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
function decodeTurnoutInfo(b: Uint8Array<ArrayBufferLike>): Z21Event[] {
	const addrMsb = b[1] & AddessByteMask.MSB;
	const addrLsb = b[2];
	const addr = (addrMsb << 8) + addrLsb;

	const zz = b[3] & 0x03;
	const state = zz === 1 ? 'STRAIGHT' : zz === 2 ? 'DIVERGING' : 'UNKNOWN';

	return [{ type: 'event.turnout.info', addr, state }];
}

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

	const command: LanXCommandKey = decodeData(b);
	if (command === 'LAN_X_BC_TRACK_POWER_OFF') {
		return [{ type: 'event.track.power', on: false }];
	} else if (command === 'LAN_X_BC_TRACK_POWER_ON') {
		return [{ type: 'event.track.power', on: true }];
	} else if (command === 'LAN_X_STATUS_CHANGED') {
		return [{ type: 'event.system.state', statusMask: b[2] }];
	} else if (command === 'LAN_X_LOCO_INFO' && b.length >= 6) {
		return decodeLocoInfo(b);
	} else if (command === 'LAN_X_TURNOUT_INFO' && b.length >= 4) {
		return decodeTurnoutInfo(b);
	}
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

/**
 * Decodes the LAN X command from raw X-Bus data.
 *
 * @param data - Raw X-Bus data bytes.
 * @returns The identified LanXCommandKey, or 'LAN_X_UNKNOWN_COMMAND' if unrecognized.
 */
function decodeData(data: Uint8Array): LanXCommandKey {
	const header = data[0];
	const commandByte = data[1];

	if (header === LAN_X_COMMANDS.LAN_X_TURNOUT_INFO.xBusHeader) {
		if (data.length === 3) {
			return 'LAN_X_GET_TURNOUT_INFO';
		} else if (data.length >= 4) {
			return 'LAN_X_TURNOUT_INFO';
		}
	} else {
		/** decode LAN X command */
		for (const [key, value] of Object.entries(LAN_X_COMMANDS)) {
			const hasXBusCmd = 'xBusCmd' in value;
			if (hasXBusCmd && header === value.xBusHeader && commandByte === value.xBusCmd) {
				return key as LanXCommandKey;
			} else if (!hasXBusCmd && header === value.xBusHeader) {
				return key as LanXCommandKey;
			}
		}
	}
	return 'LAN_X_UNKNOWN_COMMAND';
}
