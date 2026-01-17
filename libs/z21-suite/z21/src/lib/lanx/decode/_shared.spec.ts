/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Direction } from '@application-platform/z21-shared';

import {
	F13ToF20FunctionsByteMask,
	F21ToF28FunctionsByteMask,
	F29ToF31FunctionsByteMask,
	F5ToF12FunctionsByteMask,
	InfoByteMask,
	LowFunctionsByteMask
} from '../../constants';

import { decodeDccAddress, decodeFunctions, decodeSpeed } from './_shared';

describe('lanx decode _shared helpers', () => {
	test('decodeDccAddress decodes 14-bit address correctly', () => {
		expect(decodeDccAddress(0x01, 0x02)).toBe(0x0102);
	});

	test('decodeSpeed interprets emergency stop and direction', () => {
		const r = decodeSpeed(0x00, 0x01); // db2: step 0, db3: speedRaw 1 => emergency stop, REV (no dir bit)
		expect(r.speedSteps).toBe(14);
		expect(r.emergencyStop).toBe(true);
		expect(r.direction).toBe(Direction.REV);
		expect(r.speed).toBe(0);
		expect(r.isMmLoco).toBe(false);
		expect(r.isOccupied).toBe(false);
	});

	test('decodeSpeed forward movement 28-step mode', () => {
		// db2: STEP=2 -> 28 steps
		// db3: direction bit set (0x80) and speedRaw = 5
		const db2 = 0x02;
		const db3 = 0x80 | 0x05;
		const r = decodeSpeed(db2, db3);
		expect(r.speedSteps).toBe(28);
		expect(r.direction).toBe(Direction.FWD);
		expect(r.emergencyStop).toBe(false);
		expect(r.speed).toBe(4); // 5 -> raw -1
	});

	test('decodeSpeed sets MM loco and occupied flags', () => {
		const db2 = InfoByteMask.MM_LOCO | InfoByteMask.OCCUPIED; // 0x10 | 0x08
		const r = decodeSpeed(db2, 0x00);
		expect(r.isMmLoco).toBe(true);
		expect(r.isOccupied).toBe(true);
		expect(r.speedSteps).toBe(14);
	});

	test('decodeFunctions returns empty when no function bytes present', () => {
		const payload = Uint8Array.from([]);
		const res = decodeFunctions(payload, 0);
		expect(res.functionMap).toEqual({});
		expect(res.isDoubleTraction).toBe(false);
		expect(res.isSmartsearch).toBe(false);
	});

	test('decodeFunctions decodes DB4 low functions including double traction', () => {
		// DB4: set L (F0), F1, and D (double traction)
		const db4 = LowFunctionsByteMask.L | LowFunctionsByteMask.F1 | LowFunctionsByteMask.D;
		const payload = Uint8Array.from([db4]);
		const res = decodeFunctions(payload, 0);
		expect(res.functionMap[0]).toBe(true);
		expect(res.functionMap[1]).toBe(true);
		expect(res.isDoubleTraction).toBe(true);
		expect(res.isSmartsearch).toBe(false);
	});

	test('decodeFunctions decodes higher function bytes (F8, F13, F21, F29)', () => {
		// Compose payload with DB4..DB8. We'll set specific bits in DB5..DB8.
		const db4 = 0x00; // no low functions
		const db5 = F5ToF12FunctionsByteMask.F8; // F8
		const db6 = F13ToF20FunctionsByteMask.F13; // F13
		const db7 = F21ToF28FunctionsByteMask.F21; // F21
		const db8 = F29ToF31FunctionsByteMask.F29; // F29
		const payload = Uint8Array.from([db4, db5, db6, db7, db8]);
		const res = decodeFunctions(payload, 0);
		expect(res.functionMap[8]).toBe(true);
		expect(res.functionMap[13]).toBe(true);
		expect(res.functionMap[21]).toBe(true);
		expect(res.functionMap[29]).toBe(true);
	});
});
