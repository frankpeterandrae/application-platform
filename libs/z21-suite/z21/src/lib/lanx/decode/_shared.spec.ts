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
	LowFunctionsByteMask,
	SpeedByteMask
} from '../../constants';

import { decodeDccAddress, decodeFunctions, decodeSpeed } from './_shared';

describe('decodeDccAddress', () => {
	it('decodes address from MSB and LSB bytes', () => {
		const address = decodeDccAddress(0xc0, 0x01);

		expect(address).toBe(1);
	});

	it('decodes maximum address', () => {
		const address = decodeDccAddress(0xff, 0xff);

		expect(address).toBe(16383);
	});

	it('decodes minimum address', () => {
		const address = decodeDccAddress(0x00, 0x00);

		expect(address).toBe(0);
	});

	it('decodes address with non-zero MSB', () => {
		const address = decodeDccAddress(0xc5, 0x39);

		expect(address).toBe(1337);
	});

	it('masks out upper bits of MSB byte', () => {
		const address = decodeDccAddress(0xff, 0x42);

		expect(address).toBe(0x3f42);
	});

	it('decodes address with MSB containing only address bits', () => {
		const address = decodeDccAddress(0x3f, 0xff);

		expect(address).toBe(16383);
	});
});

describe('decodeSpeed', () => {
	it('decodes 14 speed steps when step code is 0', () => {
		const result = decodeSpeed(0b00, 0b00000010);

		expect(result.speedSteps).toBe(14);
		expect(result.speed).toBe(1);
	});

	it('decodes 28 speed steps when step code is 2', () => {
		const result = decodeSpeed(0b10, 0b00000010);

		expect(result.speedSteps).toBe(28);
		expect(result.speed).toBe(1);
	});

	it('decodes 128 speed steps when step code is 4', () => {
		const result = decodeSpeed(0b100, 0b00000010);

		expect(result.speedSteps).toBe(128);
		expect(result.speed).toBe(1);
	});

	it('decodes forward direction when direction bit is set', () => {
		const result = decodeSpeed(0, SpeedByteMask.DIRECTION_FORWARD | 0b00000010);

		expect(result.direction).toBe(Direction.FWD);
	});

	it('decodes reverse direction when direction bit is not set', () => {
		const result = decodeSpeed(0, 0b00000010);

		expect(result.direction).toBe(Direction.REV);
	});

	it('decodes emergency stop when speed value is 1', () => {
		const result = decodeSpeed(0, 0b00000001);

		expect(result.emergencyStop).toBe(true);
		expect(result.speed).toBe(0);
	});

	it('decodes normal stop when speed value is 0', () => {
		const result = decodeSpeed(0, 0b00000000);

		expect(result.emergencyStop).toBe(false);
		expect(result.speed).toBe(0);
	});

	it('decodes speed by subtracting 1 from raw value when greater than 1', () => {
		const result = decodeSpeed(0, 0b00001010);

		expect(result.speed).toBe(9);
		expect(result.emergencyStop).toBe(false);
	});

	it('decodes maximum speed value', () => {
		const result = decodeSpeed(0, 0b01111111);

		expect(result.speed).toBe(126);
	});

	it('decodes MM loco flag when set', () => {
		const result = decodeSpeed(InfoByteMask.MM_LOCO, 0);

		expect(result.isMmLoco).toBe(true);
	});

	it('decodes MM loco flag when not set', () => {
		const result = decodeSpeed(0, 0);

		expect(result.isMmLoco).toBe(false);
	});

	it('decodes occupied flag when set', () => {
		const result = decodeSpeed(InfoByteMask.OCCUPIED, 0);

		expect(result.isOccupied).toBe(true);
	});

	it('decodes occupied flag when not set', () => {
		const result = decodeSpeed(0, 0);

		expect(result.isOccupied).toBe(false);
	});

	it('decodes all flags together', () => {
		const result = decodeSpeed(InfoByteMask.MM_LOCO | InfoByteMask.OCCUPIED | 0b10, SpeedByteMask.DIRECTION_FORWARD | 0b00101010);

		expect(result.speedSteps).toBe(28);
		expect(result.speed).toBe(41);
		expect(result.direction).toBe(Direction.FWD);
		expect(result.isMmLoco).toBe(true);
		expect(result.isOccupied).toBe(true);
		expect(result.emergencyStop).toBe(false);
	});
});

describe('decodeFunctions', () => {
	it('returns empty function map when no function bytes present', () => {
		const result = decodeFunctions(new Uint8Array([]), 0);

		expect(result.functionMap).toEqual({});
		expect(result.isDoubleTraction).toBe(false);
		expect(result.isSmartsearch).toBe(false);
	});

	it('decodes F0 to F4 from first function byte', () => {
		const db4 = LowFunctionsByteMask.L | LowFunctionsByteMask.F1 | LowFunctionsByteMask.F3;
		const result = decodeFunctions(new Uint8Array([db4]), 0);

		expect(result.functionMap[0]).toBe(true);
		expect(result.functionMap[1]).toBe(true);
		expect(result.functionMap[2]).toBe(false);
		expect(result.functionMap[3]).toBe(true);
		expect(result.functionMap[4]).toBe(false);
	});

	it('decodes double traction flag when set', () => {
		const db4 = LowFunctionsByteMask.D;
		const result = decodeFunctions(new Uint8Array([db4]), 0);

		expect(result.isDoubleTraction).toBe(true);
	});

	it('decodes smartsearch flag when set', () => {
		const db4 = LowFunctionsByteMask.S;
		const result = decodeFunctions(new Uint8Array([db4]), 0);

		expect(result.isSmartsearch).toBe(true);
	});

	it('decodes F5 to F12 from second function byte', () => {
		const db5 = F5ToF12FunctionsByteMask.F5 | F5ToF12FunctionsByteMask.F8 | F5ToF12FunctionsByteMask.F12;
		const result = decodeFunctions(new Uint8Array([0, db5]), 0);

		expect(result.functionMap[5]).toBe(true);
		expect(result.functionMap[6]).toBe(false);
		expect(result.functionMap[7]).toBe(false);
		expect(result.functionMap[8]).toBe(true);
		expect(result.functionMap[9]).toBe(false);
		expect(result.functionMap[10]).toBe(false);
		expect(result.functionMap[11]).toBe(false);
		expect(result.functionMap[12]).toBe(true);
	});

	it('decodes F13 to F20 from third function byte', () => {
		const db6 = F13ToF20FunctionsByteMask.F13 | F13ToF20FunctionsByteMask.F16 | F13ToF20FunctionsByteMask.F20;
		const result = decodeFunctions(new Uint8Array([0, 0, db6]), 0);

		expect(result.functionMap[13]).toBe(true);
		expect(result.functionMap[14]).toBe(false);
		expect(result.functionMap[15]).toBe(false);
		expect(result.functionMap[16]).toBe(true);
		expect(result.functionMap[17]).toBe(false);
		expect(result.functionMap[18]).toBe(false);
		expect(result.functionMap[19]).toBe(false);
		expect(result.functionMap[20]).toBe(true);
	});

	it('decodes F21 to F28 from fourth function byte', () => {
		const db7 = F21ToF28FunctionsByteMask.F21 | F21ToF28FunctionsByteMask.F24 | F21ToF28FunctionsByteMask.F28;
		const result = decodeFunctions(new Uint8Array([0, 0, 0, db7]), 0);

		expect(result.functionMap[21]).toBe(true);
		expect(result.functionMap[22]).toBe(false);
		expect(result.functionMap[23]).toBe(false);
		expect(result.functionMap[24]).toBe(true);
		expect(result.functionMap[25]).toBe(false);
		expect(result.functionMap[26]).toBe(false);
		expect(result.functionMap[27]).toBe(false);
		expect(result.functionMap[28]).toBe(true);
	});

	it('decodes F29 to F31 from fifth function byte', () => {
		const db8 = F29ToF31FunctionsByteMask.F29 | F29ToF31FunctionsByteMask.F31;
		const result = decodeFunctions(new Uint8Array([0, 0, 0, 0, db8]), 0);

		expect(result.functionMap[29]).toBe(true);
		expect(result.functionMap[30]).toBe(false);
		expect(result.functionMap[31]).toBe(true);
	});

	it('decodes all functions when all bytes present and all bits set', () => {
		const db4 = 0xff;
		const db5 = 0xff;
		const db6 = 0xff;
		const db7 = 0xff;
		const db8 = 0xff;
		const result = decodeFunctions(new Uint8Array([db4, db5, db6, db7, db8]), 0);

		for (let i = 0; i <= 31; i++) {
			expect(result.functionMap[i]).toBe(true);
		}
		expect(result.isDoubleTraction).toBe(true);
		expect(result.isSmartsearch).toBe(true);
	});

	it('decodes no functions when all bytes present and all bits cleared', () => {
		const result = decodeFunctions(new Uint8Array([0, 0, 0, 0, 0]), 0);

		for (let i = 0; i <= 31; i++) {
			expect(result.functionMap[i]).toBe(false);
		}
		expect(result.isDoubleTraction).toBe(false);
		expect(result.isSmartsearch).toBe(false);
	});

	it('uses correct start index to read function bytes', () => {
		const db4 = LowFunctionsByteMask.L;
		const result = decodeFunctions(new Uint8Array([0xff, 0xff, db4]), 2);

		expect(result.functionMap[0]).toBe(true);
	});

	it('handles partial function data with only first two bytes', () => {
		const db4 = LowFunctionsByteMask.F1;
		const db5 = F5ToF12FunctionsByteMask.F10;
		const result = decodeFunctions(new Uint8Array([db4, db5]), 0);

		expect(result.functionMap[1]).toBe(true);
		expect(result.functionMap[10]).toBe(true);
		expect(result.functionMap[13]).toBeUndefined();
	});

	it('handles partial function data with only first three bytes', () => {
		const db4 = LowFunctionsByteMask.F2;
		const db5 = F5ToF12FunctionsByteMask.F11;
		const db6 = F13ToF20FunctionsByteMask.F15;
		const result = decodeFunctions(new Uint8Array([db4, db5, db6]), 0);

		expect(result.functionMap[2]).toBe(true);
		expect(result.functionMap[11]).toBe(true);
		expect(result.functionMap[15]).toBe(true);
		expect(result.functionMap[21]).toBeUndefined();
	});

	it('handles partial function data with only first four bytes', () => {
		const db4 = LowFunctionsByteMask.F3;
		const db5 = F5ToF12FunctionsByteMask.F12;
		const db6 = F13ToF20FunctionsByteMask.F16;
		const db7 = F21ToF28FunctionsByteMask.F25;
		const result = decodeFunctions(new Uint8Array([db4, db5, db6, db7]), 0);

		expect(result.functionMap[3]).toBe(true);
		expect(result.functionMap[12]).toBe(true);
		expect(result.functionMap[16]).toBe(true);
		expect(result.functionMap[25]).toBe(true);
		expect(result.functionMap[29]).toBeUndefined();
	});

	it('returns empty map when start index is beyond array bounds', () => {
		const result = decodeFunctions(new Uint8Array([0xff]), 5);

		expect(result.functionMap).toEqual({});
		expect(result.isDoubleTraction).toBe(false);
		expect(result.isSmartsearch).toBe(false);
	});
});
