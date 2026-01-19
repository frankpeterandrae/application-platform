/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor, extractAddressBytes } from '@application-platform/shared-node-test';
import { Direction, LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { AddessByteMask, FULL_BYTE_MASK, SpeedByteMask } from '../../../constants';

import { encodeLocoDrive128 } from './drive';

describe('encodeLocoDrive128', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const fullCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128;
		expect(buffer[4]).toBe(fullCommand.xHeader);
		expect(buffer[5]).toBe(fullCommand.xBusCmd);
	}

	// Helper function to extract speed byte from frame
	function extractSpeedByte(buffer: Buffer): number {
		return buffer[8];
	}

	// Helper function to extract address bytes from frame
	function extractAddress(buffer: Buffer): { high: number; low: number } {
		return extractAddressBytes(buffer, 6);
	}

	// Helper function to verify speed encoding (step + 1)
	// Helper function to verify speed encoding (step + 1)
	function expectSpeedEncoding(buffer: Buffer, step: number): void {
		const speedByte = extractSpeedByte(buffer);
		const speedValue = speedByte & SpeedByteMask.VALUE;
		expect(speedValue).toBe(step === 0 ? 0 : step + 1);
	}

	// Helper function to verify direction bit
	function expectDirection(buffer: Buffer, direction: Direction): void {
		const speedByte = extractSpeedByte(buffer);
		const expectedBit = direction === 'FWD' ? SpeedByteMask.DIRECTION_FORWARD : 0x00;
		expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(expectedBit);
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
		it('encodes forward direction with zero speed', () => {
			const result = encodeLocoDrive128(3, 0, 'FWD');

			expectValidLanXFrame(result);
			expectValidXor(result);
		});

		it('encodes reverse direction with zero speed', () => {
			const result = encodeLocoDrive128(3, 0, 'REV');

			expectValidLanXFrame(result);
			expectValidXor(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLocoDrive128(100, 50, 'FWD');

			expectValidXor(result);
		});

		it('encodes 128 speed steps indicator', () => {
			const result = encodeLocoDrive128(100, 50, 'FWD');

			expect(result[5]).toBe(0x13); // xBusCmd for 128 speed steps
		});
	});

	describe('address encoding', () => {
		it('encodes minimum valid address', () => {
			const result = encodeLocoDrive128(1, 10, 'FWD');

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x01 });
		});

		it('encodes maximum valid address', () => {
			const result = encodeLocoDrive128(9999, 10, 'FWD');

			const addr = extractAddress(result);
			const expected = calculateAddressBytes(9999);
			expect(addr).toEqual(expected);
		});

		it('encodes short address correctly', () => {
			const result = encodeLocoDrive128(3, 50, 'FWD');

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x03 });
		});

		it('encodes long address with high byte correctly', () => {
			const result = encodeLocoDrive128(1000, 50, 'FWD');

			const addr = extractAddress(result);
			const expected = calculateAddressBytes(1000);
			expect(addr).toEqual(expected);
		});

		it('masks address high byte to 6 bits', () => {
			const result = encodeLocoDrive128(9999, 50, 'FWD');

			const addrHigh = extractAddress(result).high;
			expect(addrHigh).toBeLessThanOrEqual(0xe7);
		});

		it('handles boundary case with address 127', () => {
			const result = encodeLocoDrive128(127, 50, 'FWD');

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x7f }); // 127 is still a short address
		});

		it('handles boundary case with address 128', () => {
			const result = encodeLocoDrive128(128, 50, 'FWD');

			const addr = extractAddress(result);
			const expected = calculateAddressBytes(128);
			expect(addr).toEqual(expected);
		});
	});

	describe('speed encoding', () => {
		it('encodes minimum speed step', () => {
			const result = encodeLocoDrive128(100, 1, 'FWD');

			expectSpeedEncoding(result, 1);
		});

		it('encodes maximum speed step', () => {
			const result = encodeLocoDrive128(100, 126, 'FWD');

			expectSpeedEncoding(result, 126);
		});

		it('clamps speed above 126 to 126', () => {
			const result = encodeLocoDrive128(100, 127, 'FWD');

			expectSpeedEncoding(result, 126);
		});

		it('encodes mid-range speed correctly', () => {
			const result = encodeLocoDrive128(100, 63, 'FWD');

			expectSpeedEncoding(result, 63);
		});

		it('encodes zero speed as zero', () => {
			const result = encodeLocoDrive128(100, 0, 'FWD');

			expectSpeedEncoding(result, 0);
		});
	});

	describe('direction encoding', () => {
		it('encodes forward direction with high bit set', () => {
			const result = encodeLocoDrive128(100, 50, 'FWD');

			expectDirection(result, 'FWD');
		});

		it('encodes reverse direction with high bit clear', () => {
			const result = encodeLocoDrive128(100, 50, 'REV');

			expectDirection(result, 'REV');
		});

		it('maintains direction bit with zero speed', () => {
			const fwdResult = encodeLocoDrive128(100, 0, 'FWD');
			const revResult = encodeLocoDrive128(100, 0, 'REV');

			expectDirection(fwdResult, 'FWD');
			expectDirection(revResult, 'REV');
		});
	});

	describe('consistency and variation', () => {
		it('produces consistent output for same parameters', () => {
			const result1 = encodeLocoDrive128(100, 50, 'FWD');
			const result2 = encodeLocoDrive128(100, 50, 'FWD');

			expect(result1).toEqual(result2);
		});

		it('produces different output for different speeds', () => {
			const result1 = encodeLocoDrive128(100, 50, 'FWD');
			const result2 = encodeLocoDrive128(100, 60, 'FWD');

			expect(result1).not.toEqual(result2);
		});

		it('produces different output for different directions', () => {
			const result1 = encodeLocoDrive128(100, 50, 'FWD');
			const result2 = encodeLocoDrive128(100, 50, 'REV');

			expect(result1).not.toEqual(result2);
		});

		it('produces different output for different addresses', () => {
			const result1 = encodeLocoDrive128(100, 50, 'FWD');
			const result2 = encodeLocoDrive128(200, 50, 'FWD');

			expect(result1).not.toEqual(result2);
		});
	});

	describe('validation and error handling', () => {
		it('throws error for address below minimum', () => {
			expect(() => encodeLocoDrive128(0, 50, 'FWD')).toThrow('Address');
		});

		it('throws error for address above maximum', () => {
			expect(() => encodeLocoDrive128(10000, 50, 'FWD')).toThrow('Address');
		});

		it('throws error for negative address', () => {
			expect(() => encodeLocoDrive128(-1, 50, 'FWD')).toThrow('Address');
		});

		it('throws error for negative speed', () => {
			expect(() => encodeLocoDrive128(100, -1, 'FWD')).toThrow('Speed out of range');
		});

		it('throws error for speed above maximum', () => {
			expect(() => encodeLocoDrive128(100, 129, 'FWD')).toThrow('Speed out of range');
		});
	});
});
