/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { AddessByteMask, FULL_BYTE_MASK } from '../../../constants';

import { encodeLanXGetLocoInfo } from './info';

describe('encodeLanXGetLocoInfo', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const locoInfoCommand = LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO;
		expect(buffer[4]).toBe(locoInfoCommand.xHeader);
		expect(buffer[5]).toBe(locoInfoCommand.xBusCmd);
	}

	// Helper function to extract address bytes from frame
	function extractAddress(buffer: Buffer): { high: number; low: number } {
		return { high: buffer[6], low: buffer[7] };
	}

	// Helper function to calculate expected address bytes
	function calculateAddressBytes(address: number): { high: number; low: number } {
		if (address <= 127) {
			return { high: 0x00, low: address };
		}
		const high = 0xc0 | ((address >> 8) & AddessByteMask.MSB);
		const low = address & FULL_BYTE_MASK;
		return { high, low };
	}

	describe('frame structure', () => {
		it('returns a buffer', () => {
			const result = encodeLanXGetLocoInfo(100);

			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('includes LAN_X header and LOCO_INFO command', () => {
			const result = encodeLanXGetLocoInfo(100);

			expectValidLanXFrame(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLanXGetLocoInfo(100);

			expectValidXor(result);
		});
	});

	describe('address encoding', () => {
		it('encodes minimum address correctly', () => {
			const result = encodeLanXGetLocoInfo(1);

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x01 });
		});

		it('encodes maximum address correctly', () => {
			const result = encodeLanXGetLocoInfo(9999);

			const addr = extractAddress(result);
			const expected = calculateAddressBytes(9999);
			expect(addr).toEqual(expected);
		});

		it('encodes shortCircuit address without prefix', () => {
			const result = encodeLanXGetLocoInfo(75);

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x4b });
		});

		it('encodes long address with prefix', () => {
			const result = encodeLanXGetLocoInfo(1000);

			const addr = extractAddress(result);
			const expected = calculateAddressBytes(1000);
			expect(addr).toEqual(expected);
		});

		it('handles boundary case with address 127', () => {
			const result = encodeLanXGetLocoInfo(127);

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x7f }); // 127 is still a shortCircuit address
		});

		it('handles boundary case with address 128', () => {
			const result = encodeLanXGetLocoInfo(128);

			const addr = extractAddress(result);
			const expected = calculateAddressBytes(128);
			expect(addr).toEqual(expected);
		});
	});

	describe('consistency and variation', () => {
		it('produces consistent output for same address', () => {
			const result1 = encodeLanXGetLocoInfo(100);
			const result2 = encodeLanXGetLocoInfo(100);

			expect(result1).toEqual(result2);
		});

		it('produces different output for different addresses', () => {
			const result1 = encodeLanXGetLocoInfo(100);
			const result2 = encodeLanXGetLocoInfo(200);

			expect(result1).not.toEqual(result2);
		});
	});

	describe('validation and error handling', () => {
		it('throws error for address below 1', () => {
			expect(() => encodeLanXGetLocoInfo(0)).toThrow('Address');
		});

		it('throws error for address above 9999', () => {
			expect(() => encodeLanXGetLocoInfo(10000)).toThrow('Address');
		});

		it('throws error for negative address', () => {
			expect(() => encodeLanXGetLocoInfo(-1)).toThrow('Address');
		});
	});
});
