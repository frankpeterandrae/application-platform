/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';

import { encodeLanXSystemStatus } from './status';

describe('encodeLanXSystemStatus', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSystemStatus();

		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSystemStatus();
		const len = result.readUInt16LE(0);

		expect(len).toBe(7);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSystemStatus();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes correct xbus header for GET_STATUS command', () => {
		const result = encodeLanXSystemStatus();
		const getStatusCommand = LAN_X_COMMANDS.LAN_X_GET_STATUS;

		expect(result[4]).toBe(getStatusCommand.xHeader);
	});

	it('includes correct xbus command byte for GET_STATUS', () => {
		const result = encodeLanXSystemStatus();
		const getStatusCommand = LAN_X_COMMANDS.LAN_X_GET_STATUS;

		expect(result[5]).toBe(getStatusCommand.xBusCmd);
	});

	it('calculates correct XOR checksum', () => {
		const result = encodeLanXSystemStatus();

		const xorChecksum = xbusXor(result.subarray(4, result.length - 1));
		expect(result[result.length - 1]).toBe(xorChecksum);
	});

	it('always produces consistent output', () => {
		const result1 = encodeLanXSystemStatus();
		const result2 = encodeLanXSystemStatus();

		expect(result1).toEqual(result2);
	});

	it('produces buffer with correct structure', () => {
		const result = encodeLanXSystemStatus();

		expect(result.length).toBeGreaterThan(0);
		expect(result[0] + (result[1] << 8)).toBe(7);
		expect(result[2] + (result[3] << 8)).toBe(Z21LanHeader.LAN_X);
	});

	it('buffer is suitable for sending over UDP', () => {
		const result = encodeLanXSystemStatus();

		expect(result.length).toBeLessThanOrEqual(255);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('creates a valid LAN_X formatted message', () => {
		const result = encodeLanXSystemStatus();

		const len = result.readUInt16LE(0);
		expect(len).toBe(result.length);
		const lanHeader = result.readUInt16LE(2);
		expect(lanHeader).toBe(0x0040);
	});
});
