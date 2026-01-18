/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';

import { encodeLanXGetFirmwareVersion } from './firmware-version';

describe('encodeLanXGetFirmwareVersion', () => {
	it('returns a buffer', () => {
		const result = encodeLanXGetFirmwareVersion();

		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXGetFirmwareVersion();
		const len = result.readUInt16LE(0);

		expect(len).toBe(7);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXGetFirmwareVersion();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes correct xbus header for GET_VERSION command', () => {
		const result = encodeLanXGetFirmwareVersion();
		const getVersionCommand = LAN_X_COMMANDS.LAN_X_GET_FIRMWARE_VERSION;

		expect(result[4]).toBe(getVersionCommand.xHeader);
	});

	it('includes correct xbus command byte for GET_VERSION', () => {
		const result = encodeLanXGetFirmwareVersion();
		const getVersionCommand = LAN_X_COMMANDS.LAN_X_GET_FIRMWARE_VERSION;

		expect(result[5]).toBe(getVersionCommand.xBusCmd);
	});

	it('calculates correct XOR checksum', () => {
		const result = encodeLanXGetFirmwareVersion();

		const xorChecksum = xbusXor(result.subarray(4, result.length - 1));
		expect(result[result.length - 1]).toBe(xorChecksum);
	});

	it('always produces consistent output', () => {
		const result1 = encodeLanXGetFirmwareVersion();
		const result2 = encodeLanXGetFirmwareVersion();

		expect(result1).toEqual(result2);
	});

	it('produces buffer with correct structure', () => {
		const result = encodeLanXGetFirmwareVersion();

		expect(result.length).toBeGreaterThan(0);
		expect(result[0] + (result[1] << 8)).toBe(7); // Length in little-endian
		expect(result[2] + (result[3] << 8)).toBe(Z21LanHeader.LAN_X); // Header in little-endian
	});

	it('buffer is suitable for sending over UDP', () => {
		const result = encodeLanXGetFirmwareVersion();

		expect(result.length).toBeLessThanOrEqual(255);
		expect(Buffer.isBuffer(result)).toBe(true);
	});
});
