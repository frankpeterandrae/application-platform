/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { xbusXor } from '../../../codec/frames';
import { AddessByteMask, FULL_BYTE_MASK, LAN_X_COMMANDS, Z21LanHeader } from '../../../constants';

import { encodeLanXGetLocoInfo } from './info';

describe('encodeLanXGetLocoInfo', () => {
	it('returns a buffer', () => {
		const result = encodeLanXGetLocoInfo(100);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXGetLocoInfo(100);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes LOCO_INFO xbus header', () => {
		const result = encodeLanXGetLocoInfo(100);

		const locoInfoCommand = LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO;
		expect(result[4]).toBe(locoInfoCommand.xBusHeader);
	});

	it('includes LOCO_INFO command byte', () => {
		const result = encodeLanXGetLocoInfo(100);

		const locoInfoCommand = LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO;
		expect(result[5]).toBe(locoInfoCommand.xBusCmd);
	});

	it('encodes minimum address correctly', () => {
		const result = encodeLanXGetLocoInfo(1);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x01);
	});

	it('encodes maximum address correctly', () => {
		const result = encodeLanXGetLocoInfo(9999);

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('encodes short address without prefix', () => {
		const result = encodeLanXGetLocoInfo(75);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x4b);
	});

	it('encodes long address with prefix', () => {
		const result = encodeLanXGetLocoInfo(1000);

		const addrHigh = 0xc0 | ((1000 >> 8) & AddessByteMask.MSB);
		const addrLow = 1000 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXGetLocoInfo(100);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same address', () => {
		const result1 = encodeLanXGetLocoInfo(100);
		const result2 = encodeLanXGetLocoInfo(100);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXGetLocoInfo(100);
		const result2 = encodeLanXGetLocoInfo(200);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 1', () => {
		expect(() => encodeLanXGetLocoInfo(0)).toThrow('Address');
	});

	it('throws error for address above 9999', () => {
		expect(() => encodeLanXGetLocoInfo(10000)).toThrow('Address');
	});

	it('throws error for negative address', () => {
		expect(() => encodeLanXGetLocoInfo(-1)).toThrow('Address');
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLanXGetLocoInfo(127);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLanXGetLocoInfo(128);

		const addrHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const addrLow = 128 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});
});
