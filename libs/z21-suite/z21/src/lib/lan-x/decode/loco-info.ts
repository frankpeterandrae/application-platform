/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

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
import type { Z21Event } from '../../z21/event-types';

/**
 * Decodes a locomotive info X-BUS datset into a Z21Event array.
 *
 * @param b - The X-BUS dataset bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXLocoInfo(b: Uint8Array<ArrayBufferLike>): Z21Event[] {
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
