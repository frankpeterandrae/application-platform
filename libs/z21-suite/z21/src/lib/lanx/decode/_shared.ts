/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Direction } from '@application-platform/z21-shared';

import {
	AddessByteMask,
	F13ToF20FunctionsByteMask,
	F21ToF28FunctionsByteMask,
	F29ToF31FunctionsByteMask,
	F5ToF12FunctionsByteMask,
	InfoByteMask,
	LowFunctionsByteMask,
	SpeedByteMask
} from '../../constants';

export type LocoFunctionDecodeResult = {
	functionMap: Record<number, boolean>;
	isDoubleTraction: boolean;
	isSmartsearch: boolean;
};

export type LocoSpeedDecodeResult = {
	speedSteps: 14 | 28 | 128;
	speed: number;
	emergencyStop: boolean;
	direction: Direction;
	isOccupied: boolean;
	isMmLoco: boolean;
};

/**
 * Decodes a DCC address from the given MSB and LSB bytes.
 *
 * @param msbByte - The MSB byte containing the high bits of the address.
 * @param lsbByte - The LSB byte containing the low bits of the address.
 *
 * @returns The decoded DCC address as a number.
 */
export function decodeDccAddress(msbByte: number, lsbByte: number): number {
	const adrMsb = msbByte & AddessByteMask.MSB;
	const adrLsb = lsbByte;
	const addr = (adrMsb << 8) + adrLsb;

	return addr;
}

/**
 * Decodes speed and direction from the given DB2 and DB3 bytes.
 * @param db2 - The DB2 byte containing speed step and info flags.
 * @param db3 - The DB3 byte containing direction and speed value.
 *
 * @returns An object containing speed steps, speed, emergency stop flag, direction, occupancy, and MM loco flag.
 */
export function decodeSpeed(db2: number, db3: number): LocoSpeedDecodeResult {
	const isMmLoco = (db2 & InfoByteMask.MM_LOCO) !== 0;
	const isOccupied = (db2 & InfoByteMask.OCCUPIED) !== 0;
	const speedStepCode = db2 & InfoByteMask.STEP;
	const speedSteps: 14 | 28 | 128 = speedStepCode === 0 ? 14 : speedStepCode === 2 ? 28 : 128;

	const direction = (db3 & SpeedByteMask.DIRECTION_FORWARD) !== 0 ? Direction.FWD : Direction.REV;
	const SPEED_VALUE_MASK = SpeedByteMask.VALUE;
	const speedRaw = db3 & SPEED_VALUE_MASK;
	// In the X-BUS protocol, a speed value of 1 encodes "emergency stop".
	// Regular speed steps are encoded as (step + 1), so:
	//   - 0 means "stop"
	//   - 1 means "emergency stop"
	//   - >= 2 represent increasing speed steps.
	const emergencyStop = speedRaw === 1;
	const speed = speedRaw <= 1 ? 0 : speedRaw - 1;

	return { speedSteps, speed, emergencyStop, direction, isOccupied, isMmLoco };
}

/**
 * Decodes function states from the payload starting at the given index.
 *
 * @param payload - The X-BUS dataset bytes.
 * @param startIndex - The starting index in the payload to read function bytes from.
 *
 * @returns An object containing the function map, double traction flag, and smartsearch flag.
 */
export function decodeFunctions(payload: Uint8Array, startIndex: number): LocoFunctionDecodeResult {
	const functionMap: Record<number, boolean> = {};
	const db4 = payload[startIndex];

	// Keine Funktionsbytes vorhanden
	if (db4 === undefined) {
		return { functionMap, isDoubleTraction: false, isSmartsearch: false };
	}

	// DB4: D,S + F0..F4
	const isDoubleTraction = (db4 & LowFunctionsByteMask.D) !== 0;
	const isSmartsearch = (db4 & LowFunctionsByteMask.S) !== 0;

	functionMap[0] = (db4 & LowFunctionsByteMask.L) !== 0; // F0 / Licht
	functionMap[1] = (db4 & LowFunctionsByteMask.F1) !== 0;
	functionMap[2] = (db4 & LowFunctionsByteMask.F2) !== 0;
	functionMap[3] = (db4 & LowFunctionsByteMask.F3) !== 0;
	functionMap[4] = (db4 & LowFunctionsByteMask.F4) !== 0;

	// DB5: F5..F12
	const db5 = payload[startIndex + 1];
	if (db5 !== undefined) {
		functionMap[5] = (db5 & F5ToF12FunctionsByteMask.F5) !== 0;
		functionMap[6] = (db5 & F5ToF12FunctionsByteMask.F6) !== 0;
		functionMap[7] = (db5 & F5ToF12FunctionsByteMask.F7) !== 0;
		functionMap[8] = (db5 & F5ToF12FunctionsByteMask.F8) !== 0;
		functionMap[9] = (db5 & F5ToF12FunctionsByteMask.F9) !== 0;
		functionMap[10] = (db5 & F5ToF12FunctionsByteMask.F10) !== 0;
		functionMap[11] = (db5 & F5ToF12FunctionsByteMask.F11) !== 0;
		functionMap[12] = (db5 & F5ToF12FunctionsByteMask.F12) !== 0;
	}

	// DB6: F13..F20
	const db6 = payload[startIndex + 2];
	if (db6 !== undefined) {
		functionMap[13] = (db6 & F13ToF20FunctionsByteMask.F13) !== 0;
		functionMap[14] = (db6 & F13ToF20FunctionsByteMask.F14) !== 0;
		functionMap[15] = (db6 & F13ToF20FunctionsByteMask.F15) !== 0;
		functionMap[16] = (db6 & F13ToF20FunctionsByteMask.F16) !== 0;
		functionMap[17] = (db6 & F13ToF20FunctionsByteMask.F17) !== 0;
		functionMap[18] = (db6 & F13ToF20FunctionsByteMask.F18) !== 0;
		functionMap[19] = (db6 & F13ToF20FunctionsByteMask.F19) !== 0;
		functionMap[20] = (db6 & F13ToF20FunctionsByteMask.F20) !== 0;
	}

	// DB7: F21..F28
	const db7 = payload[startIndex + 3];
	if (db7 !== undefined) {
		functionMap[21] = (db7 & F21ToF28FunctionsByteMask.F21) !== 0;
		functionMap[22] = (db7 & F21ToF28FunctionsByteMask.F22) !== 0;
		functionMap[23] = (db7 & F21ToF28FunctionsByteMask.F23) !== 0;
		functionMap[24] = (db7 & F21ToF28FunctionsByteMask.F24) !== 0;
		functionMap[25] = (db7 & F21ToF28FunctionsByteMask.F25) !== 0;
		functionMap[26] = (db7 & F21ToF28FunctionsByteMask.F26) !== 0;
		functionMap[27] = (db7 & F21ToF28FunctionsByteMask.F27) !== 0;
		functionMap[28] = (db7 & F21ToF28FunctionsByteMask.F28) !== 0;
	}

	// DB8: F29..F31
	const db8 = payload[startIndex + 4];
	if (db8 !== undefined) {
		functionMap[29] = (db8 & F29ToF31FunctionsByteMask.F29) !== 0;
		functionMap[30] = (db8 & F29ToF31FunctionsByteMask.F30) !== 0;
		functionMap[31] = (db8 & F29ToF31FunctionsByteMask.F31) !== 0;
	}

	return { functionMap, isDoubleTraction, isSmartsearch };
}
