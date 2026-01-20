/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { encodeLanXGetFirmwareVersion } from './firmware-version';

describe('encodeLanXGetFirmwareVersion', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);

		const firmwareVersionCommand = LAN_X_COMMANDS.LAN_X_GET_FIRMWARE_VERSION;
		expect(buffer[4]).toBe(firmwareVersionCommand.xHeader);
		expect(buffer[5]).toBe(firmwareVersionCommand.xBusCmd);
	}

	// Helper function to verify frame length
	function expectFrameLength(buffer: Buffer, expectedLength: number): void {
		expect(buffer.readUInt16LE(0)).toBe(expectedLength);
		expect(buffer.length).toBe(expectedLength);
	}

	describe('frame structure', () => {
		it('returns a buffer', () => {
			const result = encodeLanXGetFirmwareVersion();

			expect(Buffer.isBuffer(result)).toBe(true);
		});

		it('includes correct LAN_X header and GET_FIRMWARE_VERSION command', () => {
			const result = encodeLanXGetFirmwareVersion();

			expectValidLanXFrame(result);
		});

		it('includes valid xor checksum', () => {
			const result = encodeLanXGetFirmwareVersion();

			expectValidXor(result);
		});

		it('encodes correct message length', () => {
			const result = encodeLanXGetFirmwareVersion();

			expectFrameLength(result, 7); // len(2) + header(2) + xHeader(1) + xBusCmd(1) + xor(1)
		});
	});

	describe('consistency', () => {
		it('produces consistent output for multiple calls', () => {
			const result1 = encodeLanXGetFirmwareVersion();
			const result2 = encodeLanXGetFirmwareVersion();

			expect(result1).toEqual(result2);
		});

		it('produces independent buffers', () => {
			const result1 = encodeLanXGetFirmwareVersion();
			const result2 = encodeLanXGetFirmwareVersion();

			expect(result1).not.toBe(result2); // Different buffer instances
			expect(result1.equals(result2)).toBe(true); // But same content
		});
	});

	describe('command encoding', () => {
		it('encodes GET_FIRMWARE_VERSION command correctly', () => {
			const result = encodeLanXGetFirmwareVersion();

			const firmwareVersionCommand = LAN_X_COMMANDS.LAN_X_GET_FIRMWARE_VERSION;
			expect(result[4]).toBe(firmwareVersionCommand.xHeader);
			expect(result[5]).toBe(firmwareVersionCommand.xBusCmd);
		});

		it('does not include any additional payload bytes', () => {
			const result = encodeLanXGetFirmwareVersion();

			// Frame should be: len(2) + header(2) + xHeader(1) + xBusCmd(1) + xor(1) = 7 bytes
			expect(result.length).toBe(7);
		});
	});
});
