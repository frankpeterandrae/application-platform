/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { decodeHwInfo } from './decode-hw-info';

describe('decodeHwInfo', () => {
	it('decodes hardware type 0x200 and firmware version 1.20', () => {
		const result = decodeHwInfo(0x00000200, 0x00000120);

		expect(result).toEqual({
			type: 'event.z21.hwinfo',
			payload: {
				hardwareType: 'Z21_OLD',
				majorVersion: 1,
				minorVersion: 20
			},
			raw: [0x00000200, 0x00000120]
		});
	});

	it('decodes hardware type 0x201 and firmware version 2.30', () => {
		const result = decodeHwInfo(0x00000201, 0x00000230);

		expect(result).toEqual({
			type: 'event.z21.hwinfo',
			payload: {
				hardwareType: 'Z21_NEW',
				majorVersion: 2,
				minorVersion: 30
			},
			raw: [0x00000201, 0x00000230]
		});
	});

	it('decodes Z21_XL hardware type', () => {
		const result = decodeHwInfo(0x00000211, 0x00000145);

		expect(result.payload.hardwareType).toBe('Z21_XL');
		expect(result.payload.majorVersion).toBe(1);
		expect(result.payload.minorVersion).toBe(45);
	});

	it('handles unknown hardware type', () => {
		const result = decodeHwInfo(0x99999999, 0x00000100);

		expect(result.payload.hardwareType).toBe('UNKNOWN');
	});

	it('decodes firmware version 0.99', () => {
		const result = decodeHwInfo(0x00000200, 0x00000099);

		expect(result.payload.majorVersion).toBe(0);
		expect(result.payload.minorVersion).toBe(99);
	});

	it('decodes firmware version 9.99', () => {
		const result = decodeHwInfo(0x00000200, 0x00000999);

		expect(result.payload.majorVersion).toBe(9);
		expect(result.payload.minorVersion).toBe(99);
	});

	it('decodes minimum firmware version 0.00', () => {
		const result = decodeHwInfo(0x00000200, 0x00000000);

		expect(result.payload.majorVersion).toBe(0);
		expect(result.payload.minorVersion).toBe(0);
	});

	it('decodes all hardware types correctly', () => {
		const types = [
			[0x00000200, 'Z21_OLD'],
			[0x00000201, 'Z21_NEW'],
			[0x00000202, 'SMARTRAIL'],
			[0x00000203, 'z21_SMALL'],
			[0x00000204, 'z21_START'],
			[0x00000205, 'SINGLE_BOOSTER'],
			[0x00000206, 'DUAL_BOOSTER'],
			[0x00000211, 'Z21_XL'],
			[0x00000212, 'XL_BOOSTER'],
			[0x00000301, 'Z21_SWITCH_DECODER'],
			[0x00000302, 'Z21_SIGNAL_DECODER']
		];

		types.forEach(([hwtype, expected]) => {
			const result = decodeHwInfo(hwtype as number, 0x00000120);
			expect(result.payload.hardwareType).toBe(expected);
		});
	});
});
