/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { encodeLanXSetLocoFunction } from './function';

describe('encodeLanXSetLocoFunction', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const fullCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;
		expect(buffer[4]).toBe(fullCommand.xHeader);
		expect(buffer[5]).toBe(fullCommand.xBusCmd);
	}

	// Helper function to extract address bytes from frame
	function extractAddress(buffer: Buffer): { high: number; low: number } {
		return { high: buffer[6], low: buffer[7] };
	}

	// Helper function to extract function byte from frame
	function extractFunctionByte(buffer: Buffer): number {
		return buffer[8];
	}

	describe('frame structure', () => {
		it('returns a buffer', () => {
			const result = encodeLanXSetLocoFunction(100, 0, 0b00);

			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('includes correct LAN_X header and command', () => {
			const result = encodeLanXSetLocoFunction(100, 0, 0b00);

			expectValidLanXFrame(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLanXSetLocoFunction(100, 10, 0b01);

			expectValidXor(result);
		});
	});

	describe('function encoding', () => {
		it.each([
			{ name: 'OFF', type: 0b00, expected: 0b00000000 },
			{ name: 'ON', type: 0b01, expected: 0b01000000 },
			{ name: 'TOGGLE', type: 0b10, expected: 0b10000000 }
		])('encodes function 0 with $name type', ({ type, expected }) => {
			const result = encodeLanXSetLocoFunction(100, 0, type);

			expect(extractFunctionByte(result)).toBe(expected);
		});

		it('encodes function 31 with ON type', () => {
			const result = encodeLanXSetLocoFunction(100, 31, 0b01);

			const funcByte = extractFunctionByte(result);
			expect(funcByte).toBe(0b01011111);
		});

		it('encodes function 15 with TOGGLE type', () => {
			const result = encodeLanXSetLocoFunction(100, 15, 0b10);

			const funcByte = extractFunctionByte(result);
			expect(funcByte).toBe(0b10001111);
		});

		it('masks type to 2 bits', () => {
			const result = encodeLanXSetLocoFunction(100, 10, 0b11111111 as any);

			const funcByte = extractFunctionByte(result);
			expect(funcByte).toBe(0b11001010);
		});

		it('correctly combines function number and type', () => {
			const testCases = [
				{ func: 0, type: 0b00, expected: 0b00000000 },
				{ func: 5, type: 0b01, expected: 0b01000101 },
				{ func: 20, type: 0b10, expected: 0b10010100 },
				{ func: 31, type: 0b11, expected: 0b11011111 }
			];

			for (const { func, type, expected } of testCases) {
				const result = encodeLanXSetLocoFunction(100, func, type);
				const funcByte = extractFunctionByte(result);
				expect(funcByte).toBe(expected);
			}
		});
	});

	describe('address encoding', () => {
		it('encodes minimum address correctly', () => {
			const result = encodeLanXSetLocoFunction(1, 5, 0b01);

			const addr = extractAddress(result);
			expect(addr).toEqual({ high: 0x00, low: 0x01 });
		});

		it.each([
			{ name: 'maximum', address: 9999, expected: { high: 0xe7, low: 0xf } },
			{ name: 'shortCircuit', address: 50, expected: { high: 0x00, low: 0x32 } },
			{ name: 'long', address: 500, expected: { high: 0xc1, low: 0xf4 } },
			{ name: 'boundary 127', address: 127, expected: { high: 0x00, low: 0x7f } },
			{ name: 'boundary 128', address: 128, expected: { high: 0xc0, low: 0x80 } }
		])('encodes $name address correctly', ({ address, expected }) => {
			const result = encodeLanXSetLocoFunction(address, 5, 0b01);

			const addr = extractAddress(result);
			expect(addr).toEqual(expected);
		});
	});

	describe('consistency and variation', () => {
		it('produces consistent output for same parameters', () => {
			const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
			const result2 = encodeLanXSetLocoFunction(100, 10, 0b01);

			expect(result1).toEqual(result2);
		});

		it('produces different output for different function numbers', () => {
			const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
			const result2 = encodeLanXSetLocoFunction(100, 11, 0b01);

			expect(result1).not.toEqual(result2);
		});

		it('produces different output for different function types', () => {
			const result1 = encodeLanXSetLocoFunction(100, 10, 0b00);
			const result2 = encodeLanXSetLocoFunction(100, 10, 0b01);

			expect(result1).not.toEqual(result2);
		});

		it('produces different output for different addresses', () => {
			const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
			const result2 = encodeLanXSetLocoFunction(200, 10, 0b01);

			expect(result1).not.toEqual(result2);
		});
	});

	describe('validation and error handling', () => {
		it('throws error for function number below zero', () => {
			expect(() => encodeLanXSetLocoFunction(100, -1, 0b01)).toThrow('Function number out of range');
		});

		it('throws error for function number above 31', () => {
			expect(() => encodeLanXSetLocoFunction(100, 32, 0b01)).toThrow('Function number out of range');
		});

		it('throws error for invalid address below 1', () => {
			expect(() => encodeLanXSetLocoFunction(0, 10, 0b01)).toThrow('Address');
		});

		it('throws error for invalid address above 9999', () => {
			expect(() => encodeLanXSetLocoFunction(10000, 10, 0b01)).toThrow('Address');
		});
	});
});
