/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { encodeLanXSystemStatus } from './status';

describe('encodeLanXSystemStatus', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const getStatusCommand = LAN_X_COMMANDS.LAN_X_GET_STATUS;
		expect(buffer[4]).toBe(getStatusCommand.xHeader);
		expect(buffer[5]).toBe(getStatusCommand.xBusCmd);
	}

	// Helper function to verify frame length
	function expectFrameLength(buffer: Buffer, expectedLength: number): void {
		expect(buffer.readUInt16LE(0)).toBe(expectedLength);
		expect(buffer.length).toBe(expectedLength);
	}

	describe('frame structure', () => {
		it('returns a buffer', () => {
			const result = encodeLanXSystemStatus();

			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('includes correct LAN_X header and GET_STATUS command', () => {
			const result = encodeLanXSystemStatus();

			expectValidLanXFrame(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLanXSystemStatus();

			expectValidXor(result);
		});

		it('encodes correct message length', () => {
			const result = encodeLanXSystemStatus();

			expectFrameLength(result, 7); // len(2) + header(2) + xBusHeader(1) + xBusCmd(1) + xor(1)
		});
	});

	describe('consistency', () => {
		it('produces consistent output for multiple calls', () => {
			const result1 = encodeLanXSystemStatus();
			const result2 = encodeLanXSystemStatus();

			expect(result1).toEqual(result2);
		});

		it('produces independent buffers', () => {
			const result1 = encodeLanXSystemStatus();
			const result2 = encodeLanXSystemStatus();

			expect(result1).not.toBe(result2); // Different buffer instances
			expect(result1.equals(result2)).toBe(true); // But same content
		});
	});

	describe('command encoding', () => {
		it('encodes GET_STATUS command correctly', () => {
			const result = encodeLanXSystemStatus();

			const getStatusCommand = LAN_X_COMMANDS.LAN_X_GET_STATUS;
			expect(result[4]).toBe(getStatusCommand.xHeader);
			expect(result[5]).toBe(getStatusCommand.xBusCmd);
		});

		it('does not include any additional payload bytes', () => {
			const result = encodeLanXSystemStatus();

			// Frame should be: len(2) + header(2) + xBusHeader(1) + xBusCmd(1) + xor(1) = 7 bytes
			expect(result.length).toBe(7);
		});
	});

	describe('UDP transmission readiness', () => {
		it('is suitable for sending over UDP', () => {
			const result = encodeLanXSystemStatus();

			expect(result.length).toBeLessThanOrEqual(255); // UDP max payload
			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('creates a valid LAN_X formatted message', () => {
			const result = encodeLanXSystemStatus();

			const len = result.readUInt16LE(0);
			expect(len).toBe(result.length);

			const lanHeader = result.readUInt16LE(2);
			expect(lanHeader).toBe(Z21LanHeader.LAN_X);
		});
	});
});
