/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { xbusXor } from '../../../codec/frames';

import { encodeLanXSetStop } from './stop';

describe('encodeLanXSetStop', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetStop();

		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetStop();
		const len = result.readUInt16LE(0);

		expect(len).toBe(6);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetStop();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes correct xbus header for SET_STOP command', () => {
		const result = encodeLanXSetStop();
		const setStopCommand = LAN_X_COMMANDS.LAN_X_SET_STOP;

		expect(result[4]).toBe(setStopCommand.xHeader);
	});

	it('calculates correct XOR checksum', () => {
		const result = encodeLanXSetStop();

		const xorChecksum = xbusXor(result.subarray(4, result.length - 1));
		expect(result[result.length - 1]).toBe(xorChecksum);
	});

	it('always produces consistent output', () => {
		const result1 = encodeLanXSetStop();
		const result2 = encodeLanXSetStop();

		expect(result1).toEqual(result2);
	});

	it('produces buffer with correct structure', () => {
		const result = encodeLanXSetStop();

		expect(result.length).toBeGreaterThan(0);
		expect(result[0] + (result[1] << 8)).toBe(6);
		expect(result[2] + (result[3] << 8)).toBe(Z21LanHeader.LAN_X);
	});

	it('buffer is suitable for sending over UDP', () => {
		const result = encodeLanXSetStop();

		expect(result.length).toBeLessThanOrEqual(255);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('creates a valid LAN_X formatted message', () => {
		const result = encodeLanXSetStop();

		const len = result.readUInt16LE(0);
		expect(len).toBe(result.length);
		const lanHeader = result.readUInt16LE(2);
		expect(lanHeader).toBe(0x0040);
	});

	it('encodes LAN_X_SET_STOP command structure correctly', () => {
		const result = encodeLanXSetStop();

		expect(result[0]).toBe(0x06);
		expect(result[1]).toBe(0x00);
		expect(result[2]).toBe(0x40);
		expect(result[3]).toBe(0x00);
		expect(result[4]).toBe(0x80);
		expect(result[5]).toBe(0x80);
	});

	it('sends complete SET_STOP frame matching expected hex', () => {
		const result = encodeLanXSetStop();
		const hex = result.toString('hex');

		expect(hex).toBe('060040008080');
	});

	it('does not include extra data bytes after checksum', () => {
		const result = encodeLanXSetStop();

		expect(result.length).toBe(6);
	});

	it('produces buffer that can be sent directly over UDP', () => {
		const result = encodeLanXSetStop();

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(result.length).toBeLessThanOrEqual(1472);
	});
});
