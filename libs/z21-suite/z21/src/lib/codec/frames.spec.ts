/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { FULL_BYTE_MASK, LAN_X_COMMANDS } from '../constants';

import { encodeLanX, xbusXor } from './frames';

describe('xbusXor', () => {
	it('returns 0 for empty array', () => {
		expect(xbusXor([])).toBe(0);
	});

	it('returns the single byte value when given one byte', () => {
		expect(xbusXor([0x42])).toBe(0x42);
	});

	it('xors multiple bytes correctly', () => {
		const bytes = [0x21, 0x80];
		const expected = 0x21 ^ 0x80;
		expect(xbusXor(bytes)).toBe(expected);
	});

	it('masks result to 8-bit value', () => {
		const bytes = [FULL_BYTE_MASK, FULL_BYTE_MASK];
		expect(xbusXor(bytes)).toBe(0);
	});

	it('handles large arrays of bytes', () => {
		const bytes = Array.from({ length: 100 }, (_, i) => i & FULL_BYTE_MASK);
		const expected = bytes.reduce((acc, b) => (acc ^ b) & FULL_BYTE_MASK, 0);
		expect(xbusXor(bytes)).toBe(expected);
	});

	it('returns consistent result for identical byte sequences', () => {
		const bytes = [0x10, 0x20, 0x30];
		const result1 = xbusXor(bytes);
		const result2 = xbusXor(bytes);
		expect(result1).toBe(result2);
	});
});

describe('encodeLanX', () => {
	it('encodes minimal xbus frame with header and checksum', () => {
		const result = encodeLanX('LAN_X_SET_STOP');

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result.length).toBe(6); // 2 (len) + 2 (header) + 1 (xbus) + 1 (xor)
	});

	it('writes correct data length at start', () => {
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const len = result.readUInt16LE(0);

		expect(len).toBe(result.length);
	});

	it('copies xbus payload to correct position', () => {
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');

		expect(result[4]).toBe(0x21);
		expect(result[5]).toBe(0x80);
	});

	it('writes xor checksum at end', () => {
		const xbus = [0x21, 0x80];
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const expectedXor = xbusXor(xbus);

		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('handles large xbus payloads', () => {
		const xbus = Array.from({ length: 100 }, (_, i) => i & FULL_BYTE_MASK);
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF', xbus);

		expect(result.length).toBe(2 + 2 + 2 + xbus.length + 1);
		expect(result.readUInt16LE(0)).toBe(result.length);
	});

	it('encodes track power command correctly', () => {
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;

		expect(result.length).toBe(7);
		expect(result[4]).toBe(trackPowerOff.xBusHeader);
		expect(result[5]).toBe(trackPowerOff.xBusCmd);
	});

	it('produces different output for different payloads', () => {
		const result1 = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const result2 = encodeLanX('LAN_X_SET_TRACK_POWER_ON');

		expect(result1).not.toEqual(result2);
	});

	it('produces consistent output for identical input', () => {
		const xbus = 'LAN_X_SET_TRACK_POWER_OFF';
		const result1 = encodeLanX(xbus);
		const result2 = encodeLanX(xbus);

		expect(result1).toEqual(result2);
	});
});
