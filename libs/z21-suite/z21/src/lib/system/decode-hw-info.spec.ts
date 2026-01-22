/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21HwinfoEvent } from '@application-platform/z21-shared';

import { decodeHwInfo } from './decode-hw-info';
type HwInfoEvent = Extract<Z21HwinfoEvent, { event: 'system.event.hwinfo' }>;
describe('decodeHwInfo', () => {
	// Helper function to decode and extract result (similar to helper functions in bootstrap.spec.ts)
	function decode(hwType: number, fwVersion: number): HwInfoEvent {
		return decodeHwInfo(hwType, fwVersion);
	}

	// Helper function to verify complete event structure
	function expectHwInfoEvent(
		result: HwInfoEvent,
		expected: {
			hardwareType: string;
			majorVersion: number;
			minorVersion: number;
			raw: [number, number];
		}
	): void {
		expect(result.event).toBe('system.event.hwinfo');
		expect(result.payload.hardwareType).toBe(expected.hardwareType);
		expect(result.payload.majorVersion).toBe(expected.majorVersion);
		expect(result.payload.minorVersion).toBe(expected.minorVersion);
		expect(result.payload.raw).toEqual(expected.raw);
	}

	// Helper function to verify firmware version
	function expectFirmwareVersion(result: HwInfoEvent, major: number, minor: number): void {
		expect(result.payload.majorVersion).toBe(major);
		expect(result.payload.minorVersion).toBe(minor);
	}

	// Helper function to verify hardware type
	function expectHardwareType(result: HwInfoEvent, hwType: string): void {
		expect(result.payload.hardwareType).toBe(hwType);
	}

	describe('hardware type and firmware version decoding', () => {
		it('decodes Z21_OLD (0x200) with firmware 1.20', () => {
			const result = decode(0x00000200, 0x00000120);

			expectHwInfoEvent(result, {
				hardwareType: 'Z21_OLD',
				majorVersion: 1,
				minorVersion: 20,
				raw: [0x00000200, 0x00000120]
			});
		});

		it('decodes Z21_NEW (0x201) with firmware 2.30', () => {
			const result = decode(0x00000201, 0x00000230);

			expectHwInfoEvent(result, {
				hardwareType: 'Z21_NEW',
				majorVersion: 2,
				minorVersion: 30,
				raw: [0x00000201, 0x00000230]
			});
		});

		it('decodes Z21_XL (0x211) with firmware 1.45', () => {
			const result = decode(0x00000211, 0x00000145);

			expectHardwareType(result, 'Z21_XL');
			expectFirmwareVersion(result, 1, 45);
		});
	});

	describe('all hardware types', () => {
		const hardwareTypes = [
			{ code: 0x00000200, name: 'Z21_OLD' },
			{ code: 0x00000201, name: 'Z21_NEW' },
			{ code: 0x00000202, name: 'SMARTRAIL' },
			{ code: 0x00000203, name: 'z21_SMALL' },
			{ code: 0x00000204, name: 'z21_START' },
			{ code: 0x00000205, name: 'SINGLE_BOOSTER' },
			{ code: 0x00000206, name: 'DUAL_BOOSTER' },
			{ code: 0x00000211, name: 'Z21_XL' },
			{ code: 0x00000212, name: 'XL_BOOSTER' },
			{ code: 0x00000301, name: 'Z21_SWITCH_DECODER' },
			{ code: 0x00000302, name: 'Z21_SIGNAL_DECODER' }
		];

		it('decodes all known hardware types correctly', () => {
			hardwareTypes.forEach(({ code, name }) => {
				const result = decode(code, 0x00000120);
				expectHardwareType(result, name);
			});
		});

		it('returns UNKNOWN for unrecognized hardware type', () => {
			const result = decode(0x99999999, 0x00000100);

			expectHardwareType(result, 'UNKNOWN');
		});
	});

	describe('firmware version decoding', () => {
		it('decodes minimum version 0.00', () => {
			const result = decode(0x00000200, 0x00000000);

			expectFirmwareVersion(result, 0, 0);
		});

		it('decodes version 0.99', () => {
			const result = decode(0x00000200, 0x00000099);

			expectFirmwareVersion(result, 0, 99);
		});

		it('decodes version 1.20', () => {
			const result = decode(0x00000200, 0x00000120);

			expectFirmwareVersion(result, 1, 20);
		});

		it('decodes version 9.99', () => {
			const result = decode(0x00000200, 0x00000999);

			expectFirmwareVersion(result, 9, 99);
		});

		it('preserves firmware version across different hardware types', () => {
			const fwVersion = 0x00000345;

			const result1 = decode(0x00000200, fwVersion);
			const result2 = decode(0x00000211, fwVersion);

			expectFirmwareVersion(result1, 3, 45);
			expectFirmwareVersion(result2, 3, 45);
		});
	});

	describe('event structure', () => {
		it('always returns event with type z21.hwinfo', () => {
			const result = decode(0x00000200, 0x00000120);

			expect(result.event).toBe('system.event.hwinfo');
		});

		it('includes payload with hardware and firmware info', () => {
			const result = decode(0x00000200, 0x00000120);

			expect(result.payload).toBeDefined();
			expect(result.payload.hardwareType).toBeDefined();
			expect(result.payload.majorVersion).toBeDefined();
			expect(result.payload.minorVersion).toBeDefined();
		});

		it('preserves raw values in result', () => {
			const hwType = 0x00000211;
			const fwVersion = 0x00000145;
			const result = decode(hwType, fwVersion);

			expect(result.payload.raw).toEqual([hwType, fwVersion]);
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same inputs', () => {
			const result1 = decode(0x00000200, 0x00000120);
			const result2 = decode(0x00000200, 0x00000120);

			expect(result1).toEqual(result2);
		});

		it('produces different output for different hardware types', () => {
			const result1 = decode(0x00000200, 0x00000120);
			const result2 = decode(0x00000201, 0x00000120);

			expect(result1.payload.hardwareType).not.toBe(result2.payload.hardwareType);
		});

		it('produces different output for different firmware versions', () => {
			const result1 = decode(0x00000200, 0x00000120);
			const result2 = decode(0x00000200, 0x00000230);

			expect(result1.payload.majorVersion).not.toBe(result2.payload.majorVersion);
		});
	});
});
