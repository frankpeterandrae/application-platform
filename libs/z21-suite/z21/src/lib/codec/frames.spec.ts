/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { LAN_X_COMMANDS } from '@application-platform/z21-shared';

import { AddessByteMask, FULL_BYTE_MASK } from '../constants';

import { encodeLanX, encodeLocoAddress, xbusXor } from './frames';

describe('xbusXor', () => {
	it('returns 0 for empty array', () => {
		expect(xbusXor([])).toBe(0);
	});

	it('returns the single byte value when given one byte', () => {
		expect(xbusXor([0x42])).toBe(0x42);
	});

	it('xors multiple bytes correctly and masks to 8 bits', () => {
		const bytes = [0x21, 0x80, FULL_BYTE_MASK];
		const expected = bytes.reduce((acc, b) => (acc ^ b) & FULL_BYTE_MASK, 0);
		expect(xbusXor(bytes)).toBe(expected);
	});
});

describe('encodeLanX', () => {
	it('encodes minimal xbus frame with header and checksum', () => {
		const result = encodeLanX('LAN_X_SET_STOP');

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result.length).toBe(6);
	});

	it('writes correct data length at start', () => {
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const len = result.readUInt16LE(0);

		expect(len).toBe(result.length);
	});

	it('copies xbus payload and checksum correctly', () => {
		const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const xbus = [LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF.xHeader, LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF.xBusCmd];
		const expectedXor = xbusXor(xbus);

		expect(result[4]).toBe(xbus[0]);
		expect(result[5]).toBe(xbus[1]);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces different output for different payloads', () => {
		const result1 = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
		const result2 = encodeLanX('LAN_X_SET_TRACK_POWER_ON');

		expect(result1).not.toEqual(result2);
	});
});

describe('encodeLocoAddress', () => {
	test('encodes small address without prefix', () => {
		const r = encodeLocoAddress(127);
		expect(r.adrMsb).toBe(0x00);
		expect(r.adrLsb).toBe(0x7f);
	});

	test('encodes large address with 0xc0 prefix and masked high bits', () => {
		const addr = 300;
		const r = encodeLocoAddress(addr);
		const expectedHigh = (0xc0 | ((addr >> 8) & AddessByteMask.MSB)) & FULL_BYTE_MASK;
		const expectedLow = addr & FULL_BYTE_MASK;
		expect(r.adrMsb).toBe(expectedHigh);
		expect(r.adrLsb).toBe(expectedLow);
	});

	test('throws for out of range addresses', () => {
		expect(() => encodeLocoAddress(0)).toThrow('out of range');
		expect(() => encodeLocoAddress(10000)).toThrow('out of range');
	});
});
