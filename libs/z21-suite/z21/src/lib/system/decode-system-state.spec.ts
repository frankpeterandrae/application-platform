/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21SystemState } from '@application-platform/z21-shared';

import { decodeSystemState } from './decode-system-state';

describe('decodeSystemState', () => {
	// Helper function to create test data (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return Uint8Array.from(bytes);
	}

	// Helper function to decode and return result
	function decode(payload: Uint8Array): Z21SystemState {
		return decodeSystemState(payload);
	}

	// Helper function to verify complete system state
	function expectSystemState(result: Z21SystemState, expected: Partial<Z21SystemState>): void {
		expect(result).toMatchObject(expected);
	}

	// Helper function to verify current measurements
	function expectCurrents(result: Z21SystemState, main: number, prog: number, filtered: number): void {
		expect(result.mainCurrentMa).toBe(main);
		expect(result.progCurrentMa).toBe(prog);
		expect(result.filteredMainCurrentMa).toBe(filtered);
	}

	// Helper function to verify voltage measurements
	function expectVoltages(result: Z21SystemState, supply: number, vcc: number): void {
		expect(result.supplyVoltageMv).toBe(supply);
		expect(result.vccVoltageMv).toBe(vcc);
	}

	// Helper function to verify state flags
	function expectStateFlags(result: Z21SystemState, central: number, centralEx: number, capabilities: number): void {
		expect(result.centralState).toBe(central);
		expect(result.centralStateEx).toBe(centralEx);
		expect(result.capabilities).toBe(capabilities);
	}

	describe('typical positive values', () => {
		it('decodes typical positive values into system state fields', () => {
			const payload = makePayload(0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09);
			const result = decode(payload);

			expectSystemState(result, {
				mainCurrentMa: 1,
				progCurrentMa: 2,
				filteredMainCurrentMa: 3,
				temperatureC: 4,
				supplyVoltageMv: 5,
				vccVoltageMv: 6,
				centralState: 7,
				centralStateEx: 8,
				capabilities: 9
			});
		});

		it('decodes all zero values correctly', () => {
			const payload = makePayload(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expectCurrents(result, 0, 0, 0);
			expectVoltages(result, 0, 0);
			expect(result.temperatureC).toBe(0);
			expectStateFlags(result, 0, 0, 0);
		});
	});

	describe('negative signed values', () => {
		it('decodes negative signed currents and temperatures', () => {
			const payload = makePayload(0xff, 0xff, 0xfe, 0xff, 0xfd, 0xff, 0xfc, 0xff, 0x00, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0x00, 0xcc);
			const result = decode(payload);

			expectSystemState(result, {
				mainCurrentMa: -1,
				progCurrentMa: -2,
				filteredMainCurrentMa: -3,
				temperatureC: -4,
				supplyVoltageMv: 0,
				vccVoltageMv: 0,
				centralState: 0xaa,
				centralStateEx: 0xbb,
				capabilities: 0xcc
			});
		});

		it('decodes minimum negative values (-32768) for signed fields', () => {
			const payload = makePayload(0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expectCurrents(result, -32768, -32768, -32768);
			expect(result.temperatureC).toBe(-32768);
		});
	});

	describe('maximum values', () => {
		it('decodes maximum unsigned values for voltages and flags', () => {
			const payload = makePayload(0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0xff);
			const result = decode(payload);

			expectSystemState(result, {
				mainCurrentMa: 32767,
				progCurrentMa: 32767,
				filteredMainCurrentMa: 32767,
				temperatureC: 32767,
				supplyVoltageMv: 65535,
				vccVoltageMv: 65535,
				centralState: 0xff,
				centralStateEx: 0xff,
				capabilities: 0xff
			});
		});

		it('decodes maximum positive values (32767) for signed fields', () => {
			const payload = makePayload(0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expectCurrents(result, 32767, 32767, 32767);
			expect(result.temperatureC).toBe(32767);
		});
	});

	describe('field-specific decoding', () => {
		it('correctly decodes current measurements independently', () => {
			const payload = makePayload(0x0a, 0x00, 0x14, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expectCurrents(result, 10, 20, 30);
		});

		it('correctly decodes voltage measurements independently', () => {
			const payload = makePayload(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe8, 0x03, 0xd0, 0x07, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expectVoltages(result, 1000, 2000);
		});

		it('correctly decodes temperature independently', () => {
			const payload = makePayload(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x37, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expect(result.temperatureC).toBe(55);
		});

		it('correctly decodes state flags independently', () => {
			const payload = makePayload(0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x12, 0x34, 0x00, 0x56);
			const result = decode(payload);

			expectStateFlags(result, 0x12, 0x34, 0x56);
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same input', () => {
			const payload = makePayload(0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09);

			const result1 = decode(payload);
			const result2 = decode(payload);

			expect(result1).toEqual(result2);
		});

		it('does not modify input payload', () => {
			const payload = makePayload(0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09);
			const originalBytes = Array.from(payload);

			decode(payload);

			expect(Array.from(payload)).toEqual(originalBytes);
		});
	});

	describe('edge cases', () => {
		it('handles mixed positive and negative values', () => {
			const payload = makePayload(0x64, 0x00, 0xff, 0xff, 0x00, 0x00, 0x01, 0x00, 0xe8, 0x03, 0xd0, 0x07, 0x11, 0x22, 0x00, 0x33);
			const result = decode(payload);

			expectCurrents(result, 100, -1, 0);
			expect(result.temperatureC).toBe(1);
			expectVoltages(result, 1000, 2000);
			expectStateFlags(result, 0x11, 0x22, 0x33);
		});

		it('handles realistic operating values', () => {
			// Realistic values: 3A current, 20°C, 15V supply
			const payload = makePayload(0xb8, 0x0b, 0x00, 0x00, 0xb8, 0x0b, 0x14, 0x00, 0x98, 0x3a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00);
			const result = decode(payload);

			expect(result.mainCurrentMa).toBe(3000);
			expect(result.progCurrentMa).toBe(0);
			expect(result.filteredMainCurrentMa).toBe(3000);
			expect(result.temperatureC).toBe(20);
			expect(result.supplyVoltageMv).toBe(15000); // 0x3a98 in little endian = 58*256 + 152 = 15000
		});
	});
});
