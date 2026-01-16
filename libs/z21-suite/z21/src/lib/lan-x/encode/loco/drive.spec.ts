/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { xbusXor } from '../../../codec/frames';
import { AddessByteMask, FULL_BYTE_MASK, LAN_X_COMMANDS, SpeedByteMask, Z21LanHeader } from '../../../constants';

import { encodeLocoDrive128 } from './drive';

describe('encodeLocoDrive128', () => {
	it('encodes forward direction with zero speed', () => {
		const result = encodeLocoDrive128(3, 0, 'FWD');

		const fullCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128;
		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
		expect(result[4]).toBe(fullCommand.xBusHeader);
		expect(result[5]).toBe(fullCommand.xBusCmd);
	});

	it('encodes reverse direction with zero speed', () => {
		const result = encodeLocoDrive128(3, 0, 'REV');

		const fullCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_DRIVE_128;
		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result[4]).toBe(fullCommand.xBusHeader);
		expect(result[5]).toBe(fullCommand.xBusCmd);
	});

	it('encodes minimum valid address', () => {
		const result = encodeLocoDrive128(1, 10, 'FWD');

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x01);
	});

	it('encodes maximum valid address', () => {
		const result = encodeLocoDrive128(9999, 10, 'FWD');

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('encodes minimum speed step', () => {
		const result = encodeLocoDrive128(100, 1, 'FWD');

		const speedByte = result[8];
		expect(speedByte & SpeedByteMask.VALUE).toBe(2);
	});

	it('encodes maximum speed step', () => {
		const result = encodeLocoDrive128(100, 126, 'FWD');

		const speedByte = result[8];
		expect(speedByte & SpeedByteMask.VALUE).toBe(127);
	});

	it('clamps speed above 126 to 126', () => {
		const result = encodeLocoDrive128(100, 127, 'FWD');

		const speedByte = result[8];
		expect(speedByte & SpeedByteMask.VALUE).toBe(127);
	});

	it('encodes forward direction with high bit set', () => {
		const result = encodeLocoDrive128(100, 50, 'FWD');

		const speedByte = result[8];
		expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(0x80);
	});

	it('encodes reverse direction with high bit clear', () => {
		const result = encodeLocoDrive128(100, 50, 'REV');

		const speedByte = result[8];
		expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(0x00);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLocoDrive128(100, 50, 'FWD');

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('encodes 128 speed steps indicator', () => {
		const result = encodeLocoDrive128(100, 50, 'FWD');

		expect(result[5]).toBe(0x13);
	});

	it('produces consistent output for same parameters', () => {
		const result1 = encodeLocoDrive128(100, 50, 'FWD');
		const result2 = encodeLocoDrive128(100, 50, 'FWD');

		expect(result1).toEqual(result2);
	});

	it('produces different output for different speeds', () => {
		const result1 = encodeLocoDrive128(100, 50, 'FWD');
		const result2 = encodeLocoDrive128(100, 60, 'FWD');

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different directions', () => {
		const result1 = encodeLocoDrive128(100, 50, 'FWD');
		const result2 = encodeLocoDrive128(100, 50, 'REV');

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLocoDrive128(100, 50, 'FWD');
		const result2 = encodeLocoDrive128(200, 50, 'FWD');

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below minimum', () => {
		expect(() => encodeLocoDrive128(0, 50, 'FWD')).toThrow('Address');
	});

	it('throws error for address above maximum', () => {
		expect(() => encodeLocoDrive128(10000, 50, 'FWD')).toThrow('Address');
	});

	it('throws error for negative address', () => {
		expect(() => encodeLocoDrive128(-1, 50, 'FWD')).toThrow('Address');
	});

	it('throws error for negative speed', () => {
		expect(() => encodeLocoDrive128(100, -1, 'FWD')).toThrow('Speed out of range');
	});

	it('throws error for speed above maximum', () => {
		expect(() => encodeLocoDrive128(100, 129, 'FWD')).toThrow('Speed out of range');
	});

	it('encodes short address correctly', () => {
		const result = encodeLocoDrive128(3, 50, 'FWD');

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x03);
	});

	it('encodes long address with high byte correctly', () => {
		const result = encodeLocoDrive128(1000, 50, 'FWD');

		const expectedHigh = 0xc0 | ((1000 >> 8) & AddessByteMask.MSB);
		const expectedLow = 1000 & FULL_BYTE_MASK;
		expect(result[6]).toBe(expectedHigh);
		expect(result[7]).toBe(expectedLow);
	});

	it('masks address high byte to 6 bits', () => {
		const result = encodeLocoDrive128(9999, 50, 'FWD');

		const addrHigh = result[6];
		expect(addrHigh).toBeLessThanOrEqual(0xe7);
	});

	it('encodes mid-range speed correctly', () => {
		const result = encodeLocoDrive128(100, 63, 'FWD');

		const speedByte = result[8];
		expect(speedByte & SpeedByteMask.VALUE).toBe(64);
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLocoDrive128(127, 50, 'FWD');

		expect(result[6]).toBe(SpeedByteMask.DIRECTION_REWARD);
		expect(result[7]).toBe(SpeedByteMask.VALUE);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLocoDrive128(128, 50, 'FWD');

		const expectedHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const expectedLow = 128 & FULL_BYTE_MASK;
		expect(result[6]).toBe(expectedHigh);
		expect(result[7]).toBe(expectedLow);
	});
});
