/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { encodeLanXSetLocoEStop } from './estop';

describe('encodeLanXSetLocoEStop', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const eStopCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_E_STOP;
		expect(buffer[4]).toBe(eStopCommand.xHeader);
	}

	// Helper function to extract address bytes from frame
	function extractAddress(buffer: Buffer): { high: number; low: number } {
		return { high: buffer[5], low: buffer[6] };
	}

	// Helper function to verify frame length
	function expectFrameLength(buffer: Buffer, expectedLength: number): void {
		expect(buffer.readUInt16LE(0)).toBe(expectedLength);
		expect(buffer).toHaveLength(expectedLength);
	}

	describe('frame structure', () => {
		it('returns a buffer', () => {
			const result = encodeLanXSetLocoEStop(100);

			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('encodes correct message length', () => {
			const result = encodeLanXSetLocoEStop(100);

			expectFrameLength(result, 8);
		});

		it('includes LAN_X header', () => {
			const result = encodeLanXSetLocoEStop(100);

			expect(result.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
		});

		it('includes E_STOP xbus header', () => {
			const result = encodeLanXSetLocoEStop(100);

			expectValidLanXFrame(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLanXSetLocoEStop(100);

			expectValidXor(result);
		});
	});

	describe('address encoding', () => {
		it.each([
			{ name: 'minimum', address: 1, expected: { high: 0x00, low: 0x01 } },
			{ name: 'maximum', address: 9999, expected: { high: 0xe7, low: 0xf } },
			{ name: 'short', address: 50, expected: { high: 0x00, low: 0x32 } },
			{ name: 'long', address: 500, expected: { high: 0xc1, low: 0xf4 } },
			{ name: 'boundary 127', address: 127, expected: { high: 0x00, low: 0x7f } },
			{ name: 'boundary 128', address: 128, expected: { high: 0xc0, low: 0x80 } }
		])('encodes $name address correctly', ({ address, expected }) => {
			const result = encodeLanXSetLocoEStop(address);

			expect(extractAddress(result)).toEqual(expected);
		});
	});

	describe('consistency and variation', () => {
		it('produces consistent output for same address', () => {
			const result1 = encodeLanXSetLocoEStop(100);
			const result2 = encodeLanXSetLocoEStop(100);

			expect(result1).toEqual(result2);
		});

		it('produces different output for different addresses', () => {
			const result1 = encodeLanXSetLocoEStop(100);
			const result2 = encodeLanXSetLocoEStop(200);

			expect(result1).not.toEqual(result2);
		});
	});

	describe('validation and error handling', () => {
		it('throws error for address below 1', () => {
			expect(() => encodeLanXSetLocoEStop(0)).toThrow('Address');
		});

		it('throws error for address above 9999', () => {
			expect(() => encodeLanXSetLocoEStop(10000)).toThrow('Address');
		});

		it('throws error for negative address', () => {
			expect(() => encodeLanXSetLocoEStop(-1)).toThrow('Address');
		});
	});
});
