/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { encodeLanXSetStop } from './stop';

describe('encodeLanXSetStop', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const setStopCommand = LAN_X_COMMANDS.LAN_X_SET_STOP;
		expect(buffer[4]).toBe(setStopCommand.xHeader);
	}

	// Helper function to verify frame length
	function expectFrameLength(buffer: Buffer, expectedLength: number): void {
		expect(buffer.readUInt16LE(0)).toBe(expectedLength);
		expect(buffer.length).toBe(expectedLength);
	}

	// Helper function to verify complete frame as hex string
	function expectFrameHex(buffer: Buffer, expectedHex: string): void {
		const hex = buffer.toString('hex');
		expect(hex).toBe(expectedHex);
	}

	describe('frame structure', () => {
		it('returns a buffer', () => {
			const result = encodeLanXSetStop();

			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('includes correct LAN_X header and SET_STOP command', () => {
			const result = encodeLanXSetStop();

			expectValidLanXFrame(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLanXSetStop();

			expectValidXor(result);
		});

		it('encodes correct message length', () => {
			const result = encodeLanXSetStop();

			expectFrameLength(result, 6); // len(2) + header(2) + xHeader(1) + xor(1)
		});
	});

	describe('consistency', () => {
		it('produces consistent output for multiple calls', () => {
			const result1 = encodeLanXSetStop();
			const result2 = encodeLanXSetStop();

			expect(result1).toEqual(result2);
		});

		it('produces independent buffers', () => {
			const result1 = encodeLanXSetStop();
			const result2 = encodeLanXSetStop();

			expect(result1).not.toBe(result2); // Different buffer instances
			expect(result1.equals(result2)).toBe(true); // But same content
		});
	});

	describe('command encoding', () => {
		it('encodes SET_STOP command correctly', () => {
			const result = encodeLanXSetStop();

			const setStopCommand = LAN_X_COMMANDS.LAN_X_SET_STOP;
			expect(result[4]).toBe(setStopCommand.xHeader);
		});

		it('sends complete SET_STOP frame matching expected hex', () => {
			const result = encodeLanXSetStop();

			expectFrameHex(result, '060040008080');
		});

		it('does not include any additional payload bytes', () => {
			const result = encodeLanXSetStop();

			// Frame should be: len(2) + header(2) + xHeader(1) + xor(1) = 6 bytes
			expect(result.length).toBe(6);
		});
	});

	describe('UDP transmission readiness', () => {
		it('is suitable for sending over UDP', () => {
			const result = encodeLanXSetStop();

			expect(result.length).toBeLessThanOrEqual(255); // UDP max payload
			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('creates a valid LAN_X formatted message', () => {
			const result = encodeLanXSetStop();

			const len = result.readUInt16LE(0);
			expect(len).toBe(result.length);

			const lanHeader = result.readUInt16LE(2);
			expect(lanHeader).toBe(Z21LanHeader.LAN_X);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			const result = encodeLanXSetStop();

			expect(Buffer.isBuffer(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			expect(result.length).toBeLessThanOrEqual(1472); // Standard Ethernet MTU
		});
	});
});
