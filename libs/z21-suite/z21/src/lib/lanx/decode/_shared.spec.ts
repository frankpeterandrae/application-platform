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

import { decodeCvAddress, decodeDccAddress, decodeFunctions, decodeSpeed } from './_shared';

describe('payload decode helpers', () => {
	// Helper function to create test function bytes (similar to helper functions in bootstrap.spec.ts)
	function makeFunctionBytes(f0_f4 = 0, f5_f12 = 0, f13_f20 = 0, f21_f28 = 0, f29_f31 = 0): Uint8Array {
		return new Uint8Array([f0_f4, f5_f12, f13_f20, f21_f28, f29_f31]);
	}

	// Helper function to verify function state
	function expectFunctionState(functionMap: Record<number, boolean>, functionNumber: number, expectedState: boolean): void {
		expect(functionMap[functionNumber]).toBe(expectedState);
	}

	// Helper function to verify multiple function states
	function expectFunctionStates(functionMap: Record<number, boolean>, states: Array<{ fn: number; state: boolean }>): void {
		for (const { fn, state } of states) {
			expectFunctionState(functionMap, fn, state);
		}
	}

	// Helper function to verify speed result structure
	function expectValidSpeedResult(result: ReturnType<typeof decodeSpeed>, expectedValues: Partial<ReturnType<typeof decodeSpeed>>): void {
		if (expectedValues.speedSteps !== undefined) expect(result.speedSteps).toBe(expectedValues.speedSteps);
		if (expectedValues.speed !== undefined) expect(result.speed).toBe(expectedValues.speed);
		if (expectedValues.direction !== undefined) expect(result.direction).toBe(expectedValues.direction);
		if (expectedValues.emergencyStop !== undefined) expect(result.emergencyStop).toBe(expectedValues.emergencyStop);
		if (expectedValues.isMmLoco !== undefined) expect(result.isMmLoco).toBe(expectedValues.isMmLoco);
		if (expectedValues.isOccupied !== undefined) expect(result.isOccupied).toBe(expectedValues.isOccupied);
	}

	describe('decodeDccAddress', () => {
		describe('basic address decoding', () => {
			it('decodes address from MSB and LSB bytes', () => {
				const address = decodeDccAddress(0xc0, 0x01);

				expect(address).toBe(1);
			});

			it('decodes minimum address', () => {
				const address = decodeDccAddress(0x00, 0x00);

				expect(address).toBe(0);
			});

			it('decodes maximum address', () => {
				const address = decodeDccAddress(0xff, 0xff);

				expect(address).toBe(16383);
			});

			it('decodes address with non-zero MSB', () => {
				const address = decodeDccAddress(0xc5, 0x39);

				expect(address).toBe(1337);
			});
		});

		describe('bit masking', () => {
			it('masks out upper bits of MSB byte', () => {
				const address = decodeDccAddress(0xff, 0x42);

				expect(address).toBe(0x3f42);
			});

			it('decodes address with MSB containing only address bits', () => {
				const address = decodeDccAddress(0x3f, 0xff);

				expect(address).toBe(16383);
			});
		});
	});

	describe('decodeSpeed', () => {
		describe('speed step detection', () => {
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
		});

		describe('direction decoding', () => {
			it('decodes forward direction when direction bit is set', () => {
				const result = decodeSpeed(0, SpeedByteMask.DIRECTION_FORWARD | 0b00000010);

				expect(result.direction).toBe(Direction.FWD);
			});

			it('decodes reverse direction when direction bit is not set', () => {
				const result = decodeSpeed(0, 0b00000010);

				expect(result.direction).toBe(Direction.REV);
			});
		});

		describe('speed value decoding', () => {
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
		});

		describe('loco type flags', () => {
			it('decodes MM loco flag when set', () => {
				const result = decodeSpeed(InfoByteMask.MM_LOCO, 0);

				expect(result.isMmLoco).toBe(true);
			});

			it('decodes MM loco flag when not set', () => {
				const result = decodeSpeed(0, 0);

				expect(result.isMmLoco).toBe(false);
			});
		});

		describe('occupied flag', () => {
			it('decodes occupied flag when set', () => {
				const result = decodeSpeed(InfoByteMask.OCCUPIED, 0);

				expect(result.isOccupied).toBe(true);
			});

			it('decodes occupied flag when not set', () => {
				const result = decodeSpeed(0, 0);

				expect(result.isOccupied).toBe(false);
			});
		});

		describe('combined decoding', () => {
			it('decodes all flags together', () => {
				const result = decodeSpeed(
					InfoByteMask.MM_LOCO | InfoByteMask.OCCUPIED | 0b10,
					SpeedByteMask.DIRECTION_FORWARD | 0b00101010
				);

				expectValidSpeedResult(result, {
					speedSteps: 28,
					speed: 41,
					direction: Direction.FWD,
					isMmLoco: true,
					isOccupied: true,
					emergencyStop: false
				});
			});
		});
	});

	describe('decodeFunctions', () => {
		describe('empty function data', () => {
			it('returns empty function map when no function bytes present', () => {
				const result = decodeFunctions(new Uint8Array([]), 0);

				expect(result.functionMap).toEqual({});
				expect(result.isDoubleTraction).toBe(false);
				expect(result.isSmartsearch).toBe(false);
			});

			it('returns empty map when start index is beyond array bounds', () => {
				const result = decodeFunctions(new Uint8Array([0xff]), 5);

				expect(result.functionMap).toEqual({});
				expect(result.isDoubleTraction).toBe(false);
				expect(result.isSmartsearch).toBe(false);
			});
		});

		describe('F0 to F4 decoding', () => {
			it('decodes F0 to F4 from first function byte', () => {
				const db4 = LowFunctionsByteMask.L | LowFunctionsByteMask.F1 | LowFunctionsByteMask.F3;
				const result = decodeFunctions(new Uint8Array([db4]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 0, state: true },
					{ fn: 1, state: true },
					{ fn: 2, state: false },
					{ fn: 3, state: true },
					{ fn: 4, state: false }
				]);
			});
		});

		describe('special flags', () => {
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
		});

		describe('F5 to F12 decoding', () => {
			it('decodes F5 to F12 from second function byte', () => {
				const db5 = F5ToF12FunctionsByteMask.F5 | F5ToF12FunctionsByteMask.F8 | F5ToF12FunctionsByteMask.F12;
				const result = decodeFunctions(new Uint8Array([0, db5]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 5, state: true },
					{ fn: 6, state: false },
					{ fn: 7, state: false },
					{ fn: 8, state: true },
					{ fn: 9, state: false },
					{ fn: 10, state: false },
					{ fn: 11, state: false },
					{ fn: 12, state: true }
				]);
			});
		});

		describe('F13 to F20 decoding', () => {
			it('decodes F13 to F20 from third function byte', () => {
				const db6 = F13ToF20FunctionsByteMask.F13 | F13ToF20FunctionsByteMask.F16 | F13ToF20FunctionsByteMask.F20;
				const result = decodeFunctions(new Uint8Array([0, 0, db6]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 13, state: true },
					{ fn: 14, state: false },
					{ fn: 15, state: false },
					{ fn: 16, state: true },
					{ fn: 17, state: false },
					{ fn: 18, state: false },
					{ fn: 19, state: false },
					{ fn: 20, state: true }
				]);
			});
		});

		describe('F21 to F28 decoding', () => {
			it('decodes F21 to F28 from fourth function byte', () => {
				const db7 = F21ToF28FunctionsByteMask.F21 | F21ToF28FunctionsByteMask.F24 | F21ToF28FunctionsByteMask.F28;
				const result = decodeFunctions(new Uint8Array([0, 0, 0, db7]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 21, state: true },
					{ fn: 22, state: false },
					{ fn: 23, state: false },
					{ fn: 24, state: true },
					{ fn: 25, state: false },
					{ fn: 26, state: false },
					{ fn: 27, state: false },
					{ fn: 28, state: true }
				]);
			});
		});

		describe('F29 to F31 decoding', () => {
			it('decodes F29 to F31 from fifth function byte', () => {
				const db8 = F29ToF31FunctionsByteMask.F29 | F29ToF31FunctionsByteMask.F31;
				const result = decodeFunctions(new Uint8Array([0, 0, 0, 0, db8]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 29, state: true },
					{ fn: 30, state: false },
					{ fn: 31, state: true }
				]);
			});
		});

		describe('all functions combined', () => {
			it('decodes all functions when all bytes present and all bits set', () => {
				const result = decodeFunctions(makeFunctionBytes(0xff, 0xff, 0xff, 0xff, 0xff), 0);

				for (let i = 0; i <= 31; i++) {
					expectFunctionState(result.functionMap, i, true);
				}
				expect(result.isDoubleTraction).toBe(true);
				expect(result.isSmartsearch).toBe(true);
			});

			it('decodes no functions when all bytes present and all bits cleared', () => {
				const result = decodeFunctions(makeFunctionBytes(0, 0, 0, 0, 0), 0);

				for (let i = 0; i <= 31; i++) {
					expectFunctionState(result.functionMap, i, false);
				}
				expect(result.isDoubleTraction).toBe(false);
				expect(result.isSmartsearch).toBe(false);
			});
		});

		describe('start index handling', () => {
			it('uses correct start index to read function bytes', () => {
				const db4 = LowFunctionsByteMask.L;
				const result = decodeFunctions(new Uint8Array([0xff, 0xff, db4]), 2);

				expectFunctionState(result.functionMap, 0, true);
			});
		});

		describe('partial function data', () => {
			it('handles partial function data with only first two bytes', () => {
				const db4 = LowFunctionsByteMask.F1;
				const db5 = F5ToF12FunctionsByteMask.F10;
				const result = decodeFunctions(new Uint8Array([db4, db5]), 0);

				expectFunctionState(result.functionMap, 1, true);
				expectFunctionState(result.functionMap, 10, true);
				expect(result.functionMap[13]).toBeUndefined();
			});

			it('handles partial function data with only first three bytes', () => {
				const db4 = LowFunctionsByteMask.F2;
				const db5 = F5ToF12FunctionsByteMask.F11;
				const db6 = F13ToF20FunctionsByteMask.F15;
				const result = decodeFunctions(new Uint8Array([db4, db5, db6]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 2, state: true },
					{ fn: 11, state: true },
					{ fn: 15, state: true }
				]);
				expect(result.functionMap[21]).toBeUndefined();
			});

			it('handles partial function data with only first four bytes', () => {
				const db4 = LowFunctionsByteMask.F3;
				const db5 = F5ToF12FunctionsByteMask.F12;
				const db6 = F13ToF20FunctionsByteMask.F16;
				const db7 = F21ToF28FunctionsByteMask.F25;
				const result = decodeFunctions(new Uint8Array([db4, db5, db6, db7]), 0);

				expectFunctionStates(result.functionMap, [
					{ fn: 3, state: true },
					{ fn: 12, state: true },
					{ fn: 16, state: true },
					{ fn: 25, state: true }
				]);
				expect(result.functionMap[29]).toBeUndefined();
			});
		});
	});

	describe('decodeCvAddress', () => {
		it('decodes CV address with +1 offset from MSB and LSB bytes', () => {
			const addr1 = decodeCvAddress(0x00, 0x00);
			expect(addr1).toBe(1);

			const addr2 = decodeCvAddress(0x00, 0x01);
			expect(addr2).toBe(2);
		});

		it('decodes maximum CV address when MSB and LSB are 0xff', () => {
			const address = decodeCvAddress(0xff, 0xff);
			expect(address).toBe(65536);
		});

		it('applies FULL_BYTE_MASK to MSB (masks out higher bits)', () => {
			// Provide an MSB with extra high bits set; masking should make it equivalent to 0xff
			const addressWithOverflowMsb = decodeCvAddress(0x1ff, 0x42);
			const expected = decodeCvAddress(0xff, 0x42);

			expect(addressWithOverflowMsb).toBe(expected);
			expect(addressWithOverflowMsb).toBe(65347);
		});
	});
});
