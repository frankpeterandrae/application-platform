/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { AddessByteMask, FULL_BYTE_MASK, LAN_X_COMMANDS, SpeedByteMask, Z21LanHeader } from '../constants';

import {
	encdodeLanXGetLocoInfo,
	encodeLanX,
	encodeLanXGetTurnoutInfo,
	encodeLanXSetLocoEStop,
	encodeLanXSetLocoFunction,
	encodeLanXSetTrackPowerOff,
	encodeLanXSetTrackPowerOn,
	encodeLanXSetTurnout,
	encodeLocoDrive128,
	xbusXor
} from './frames';

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

describe('encodeLanXSetTrackPowerOff', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetTrackPowerOff();
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetTrackPowerOff();
		const len = result.readUInt16LE(0);

		expect(len).toBe(7);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetTrackPowerOff();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes STATUS xbus header', () => {
		const result = encodeLanXSetTrackPowerOff();

		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
		expect(result[4]).toBe(trackPowerOff.xBusHeader);
	});

	it('includes Off track power value', () => {
		const result = encodeLanXSetTrackPowerOff();

		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
		expect(result[5]).toBe(trackPowerOff.xBusCmd);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTrackPowerOff();
		const trackPowerOff = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
		const payload = [trackPowerOff.xBusHeader, trackPowerOff.xBusCmd];
		const expectedXor = xbusXor(payload);

		expect(result[6]).toBe(expectedXor);
	});

	it('returns different result than power on command', () => {
		const off = encodeLanXSetTrackPowerOff();
		const on = encodeLanXSetTrackPowerOn();

		expect(off).not.toEqual(on);
	});

	it('produces consistent output on multiple calls', () => {
		const result1 = encodeLanXSetTrackPowerOff();
		const result2 = encodeLanXSetTrackPowerOff();

		expect(result1).toEqual(result2);
	});
});

describe('encodeLanXSetTrackPowerOn', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetTrackPowerOn();
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetTrackPowerOn();
		const len = result.readUInt16LE(0);

		expect(len).toBe(7);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetTrackPowerOn();
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes STATUS xbus header', () => {
		const result = encodeLanXSetTrackPowerOn();

		const trackPowerOn = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
		expect(result[4]).toBe(trackPowerOn.xBusHeader);
	});

	it('includes On track power value', () => {
		const result = encodeLanXSetTrackPowerOn();

		const trackPowerOn = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
		expect(result[5]).toBe(trackPowerOn.xBusCmd);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTrackPowerOn();
		const trackPowerOn = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_ON;
		const payload = [trackPowerOn.xBusHeader, trackPowerOn.xBusCmd];
		const expectedXor = xbusXor(payload);

		expect(result[6]).toBe(expectedXor);
	});

	it('returns different result than power off command', () => {
		const on = encodeLanXSetTrackPowerOn();
		const off = encodeLanXSetTrackPowerOff();

		expect(on).not.toEqual(off);
	});

	it('produces consistent output on multiple calls', () => {
		const result1 = encodeLanXSetTrackPowerOn();
		const result2 = encodeLanXSetTrackPowerOn();

		expect(result1).toEqual(result2);
	});
});

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

describe('encodeLanXSetLocoFunction', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b00);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes function 0 with OFF type', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b00);

		const fullCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_FUNCTION;
		expect(result[4]).toBe(fullCommand.xBusHeader);
		expect(result[5]).toBe(fullCommand.xBusCmd);
		expect(result[8]).toBe(0b00000000);
	});

	it('encodes function 0 with ON type', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b01);

		expect(result[8]).toBe(0b01000000);
	});

	it('encodes function 0 with TOGGLE type', () => {
		const result = encodeLanXSetLocoFunction(100, 0, 0b10);

		expect(result[8]).toBe(0b10000000);
	});

	it('encodes function 31 with ON type', () => {
		const result = encodeLanXSetLocoFunction(100, 31, 0b01);

		expect(result[8]).toBe(0b01011111);
	});

	it('encodes function 15 with TOGGLE type', () => {
		const result = encodeLanXSetLocoFunction(100, 15, 0b10);

		expect(result[8]).toBe(0b10001111);
	});

	it('encodes minimum address correctly', () => {
		const result = encodeLanXSetLocoFunction(1, 5, 0b01);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x01);
	});

	it('encodes maximum address correctly', () => {
		const result = encodeLanXSetLocoFunction(9999, 5, 0b01);

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('encodes short address correctly', () => {
		const result = encodeLanXSetLocoFunction(50, 10, 0b01);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x32);
	});

	it('encodes long address with prefix correctly', () => {
		const result = encodeLanXSetLocoFunction(500, 10, 0b01);

		const addrHigh = 0xc0 | ((500 >> 8) & AddessByteMask.MSB);
		const addrLow = 500 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetLocoFunction(100, 10, 0b01);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same parameters', () => {
		const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
		const result2 = encodeLanXSetLocoFunction(100, 10, 0b01);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different function numbers', () => {
		const result1 = encodeLanXSetLocoFunction(100, 10, 0b01);
		const result2 = encodeLanXSetLocoFunction(100, 11, 0b01);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different function types', () => {
		const result1 = encodeLanXSetLocoFunction(100, 10, 0b00);
		const result2 = encodeLanXSetLocoFunction(100, 10, 0b01);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for function number below zero', () => {
		expect(() => encodeLanXSetLocoFunction(100, -1, 0b01)).toThrow('Function number out of range');
	});

	it('throws error for function number above 31', () => {
		expect(() => encodeLanXSetLocoFunction(100, 32, 0b01)).toThrow('Function number out of range');
	});

	it('throws error for invalid address below 1', () => {
		expect(() => encodeLanXSetLocoFunction(0, 10, 0b01)).toThrow('Address');
	});

	it('throws error for invalid address above 9999', () => {
		expect(() => encodeLanXSetLocoFunction(10000, 10, 0b01)).toThrow('Address');
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLanXSetLocoFunction(127, 10, 0b01);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLanXSetLocoFunction(128, 10, 0b01);

		const addrHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const addrLow = 128 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('masks type to 2 bits', () => {
		const result = encodeLanXSetLocoFunction(100, 10, 0b11111111 as any);

		expect(result[8]).toBe(0b11001010);
	});
});

describe('encdodeLanXGetLocoInfo', () => {
	it('returns a buffer', () => {
		const result = encdodeLanXGetLocoInfo(100);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('includes LAN_X header', () => {
		const result = encdodeLanXGetLocoInfo(100);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes LOCO_INFO xbus header', () => {
		const result = encdodeLanXGetLocoInfo(100);

		const locoInfoCommand = LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO;
		expect(result[4]).toBe(locoInfoCommand.xBusHeader);
	});

	it('includes LOCO_INFO command byte', () => {
		const result = encdodeLanXGetLocoInfo(100);

		const locoInfoCommand = LAN_X_COMMANDS.LAN_X_GET_LOCO_INFO;
		expect(result[5]).toBe(locoInfoCommand.xBusCmd);
	});

	it('encodes minimum address correctly', () => {
		const result = encdodeLanXGetLocoInfo(1);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x01);
	});

	it('encodes maximum address correctly', () => {
		const result = encdodeLanXGetLocoInfo(9999);

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('encodes short address without prefix', () => {
		const result = encdodeLanXGetLocoInfo(75);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x4b);
	});

	it('encodes long address with prefix', () => {
		const result = encdodeLanXGetLocoInfo(1000);

		const addrHigh = 0xc0 | ((1000 >> 8) & AddessByteMask.MSB);
		const addrLow = 1000 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encdodeLanXGetLocoInfo(100);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same address', () => {
		const result1 = encdodeLanXGetLocoInfo(100);
		const result2 = encdodeLanXGetLocoInfo(100);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encdodeLanXGetLocoInfo(100);
		const result2 = encdodeLanXGetLocoInfo(200);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 1', () => {
		expect(() => encdodeLanXGetLocoInfo(0)).toThrow('Address');
	});

	it('throws error for address above 9999', () => {
		expect(() => encdodeLanXGetLocoInfo(10000)).toThrow('Address');
	});

	it('throws error for negative address', () => {
		expect(() => encdodeLanXGetLocoInfo(-1)).toThrow('Address');
	});

	it('handles boundary case with address 127', () => {
		const result = encdodeLanXGetLocoInfo(127);

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encdodeLanXGetLocoInfo(128);

		const addrHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const addrLow = 128 & FULL_BYTE_MASK;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});
});

describe('encodeLanXGetTurnoutInfo', () => {
	it('returns a buffer', () => {
		const result = encodeLanXGetTurnoutInfo(100);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXGetTurnoutInfo(100);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes TURNOUT_INFO xbus header', () => {
		const result = encodeLanXGetTurnoutInfo(100);

		const turnoutInfoCommand = LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO;
		expect(result[4]).toBe(turnoutInfoCommand.xBusHeader);
	});

	it('encodes minimum accessory address', () => {
		const result = encodeLanXGetTurnoutInfo(0);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x00);
	});

	it('encodes maximum accessory address', () => {
		const result = encodeLanXGetTurnoutInfo(16383);

		const addrHigh = (16383 >> 8) & AddessByteMask.MSB;
		const addrLow = 16383 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('encodes mid-range accessory address', () => {
		const result = encodeLanXGetTurnoutInfo(500);

		const addrHigh = (500 >> 8) & AddessByteMask.MSB;
		const addrLow = 500 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXGetTurnoutInfo(100);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same address', () => {
		const result1 = encodeLanXGetTurnoutInfo(100);
		const result2 = encodeLanXGetTurnoutInfo(100);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXGetTurnoutInfo(100);
		const result2 = encodeLanXGetTurnoutInfo(200);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 0', () => {
		expect(() => encodeLanXGetTurnoutInfo(-1)).toThrow('Accessory address');
	});

	it('throws error for address above 16383', () => {
		expect(() => encodeLanXGetTurnoutInfo(16384)).toThrow('Accessory address');
	});

	it('handles boundary case with address 255', () => {
		const result = encodeLanXGetTurnoutInfo(255);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0xff);
	});

	it('handles boundary case with address 256', () => {
		const result = encodeLanXGetTurnoutInfo(256);

		expect(result[5]).toBe(0x01);
		expect(result[6]).toBe(0x00);
	});

	it('masks high byte to 6 bits', () => {
		const result = encodeLanXGetTurnoutInfo(16383);

		expect(result[5]).toBe(AddessByteMask.MSB);
	});
});

describe('encodeLanXSetTurnout', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes SET_TURNOUT xbus header', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		const setTurnoutCommand = LAN_X_COMMANDS.LAN_X_SET_TURNOUT;
		expect(result[4]).toBe(setTurnoutCommand.xBusHeader);
	});

	it('encodes port 0 activated', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		expect(result[7] & 0x01).toBe(0x00);
		expect(result[7] & 0x08).toBe(0x08);
	});

	it('encodes port 1 activated', () => {
		const result = encodeLanXSetTurnout(100, 1, true, false);

		expect(result[7] & 0x01).toBe(0x01);
		expect(result[7] & 0x08).toBe(0x08);
	});

	it('encodes port 0 deactivated', () => {
		const result = encodeLanXSetTurnout(100, 0, false, false);

		expect(result[7] & 0x01).toBe(0x00);
		expect(result[7] & 0x08).toBe(0x00);
	});

	it('encodes port 1 deactivated', () => {
		const result = encodeLanXSetTurnout(100, 1, false, false);

		expect(result[7] & 0x01).toBe(0x01);
		expect(result[7] & 0x08).toBe(0x00);
	});

	it('encodes queue enabled', () => {
		const result = encodeLanXSetTurnout(100, 0, true, true);

		expect(result[7] & 0x20).toBe(0x20);
	});

	it('encodes queue disabled', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		expect(result[7] & 0x20).toBe(0x00);
	});

	it('sets base bit pattern with 0x80', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		expect(result[7] & 0x80).toBe(0x80);
	});

	it('encodes minimum accessory address', () => {
		const result = encodeLanXSetTurnout(0, 0, true, false);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x00);
	});

	it('encodes maximum accessory address', () => {
		const result = encodeLanXSetTurnout(16383, 0, true, false);

		const addrHigh = (16383 >> 8) & AddessByteMask.MSB;
		const addrLow = 16383 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTurnout(100, 0, true, false);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same parameters', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 0, true, false);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different ports', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 1, true, false);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different activation states', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 0, false, false);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different queue states', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(100, 0, true, true);

		expect(result1).not.toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXSetTurnout(100, 0, true, false);
		const result2 = encodeLanXSetTurnout(200, 0, true, false);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 0', () => {
		expect(() => encodeLanXSetTurnout(-1, 0, true, false)).toThrow('Accessory address');
	});

	it('throws error for address above 16383', () => {
		expect(() => encodeLanXSetTurnout(16384, 0, true, false)).toThrow('Accessory address');
	});

	it('encodes all flags combined correctly', () => {
		const result = encodeLanXSetTurnout(100, 1, true, true);

		const db2 = result[7];
		expect(db2 & 0x80).toBe(0x80);
		expect(db2 & 0x20).toBe(0x20);
		expect(db2 & 0x08).toBe(0x08);
		expect(db2 & 0x01).toBe(0x01);
	});

	it('masks control byte to single byte', () => {
		const result = encodeLanXSetTurnout(100, 1, true, true);

		expect(result[7]).toBeLessThanOrEqual(0xff);
	});

	it('handles boundary case with address 255', () => {
		const result = encodeLanXSetTurnout(255, 0, true, false);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0xff);
	});

	it('handles boundary case with address 256', () => {
		const result = encodeLanXSetTurnout(256, 0, true, false);

		expect(result[5]).toBe(0x01);
		expect(result[6]).toBe(0x00);
	});
});

describe('encodeLanXSetLocoEStop', () => {
	it('returns a buffer', () => {
		const result = encodeLanXSetLocoEStop(100);
		expect(Buffer.isBuffer(result)).toBe(true);
	});

	it('encodes correct message length', () => {
		const result = encodeLanXSetLocoEStop(100);
		const len = result.readUInt16LE(0);

		expect(len).toBe(8);
	});

	it('includes LAN_X header', () => {
		const result = encodeLanXSetLocoEStop(100);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('includes E_STOP xbus header', () => {
		const result = encodeLanXSetLocoEStop(100);

		const eStopCommand = LAN_X_COMMANDS.LAN_X_SET_LOCO_E_STOP;
		expect(result[4]).toBe(eStopCommand.xBusHeader);
	});

	it('encodes minimum address correctly', () => {
		const result = encodeLanXSetLocoEStop(1);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x01);
	});

	it('encodes maximum address correctly', () => {
		const result = encodeLanXSetLocoEStop(9999);

		const addrHigh = 0xc0 | ((9999 >> 8) & AddessByteMask.MSB);
		const addrLow = 9999 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('encodes short address correctly', () => {
		const result = encodeLanXSetLocoEStop(50);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x32);
	});

	it('encodes long address with prefix correctly', () => {
		const result = encodeLanXSetLocoEStop(500);

		const addrHigh = 0xc0 | ((500 >> 8) & AddessByteMask.MSB);
		const addrLow = 500 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetLocoEStop(100);

		const payload = Array.from(result.slice(4, result.length - 1));
		const expectedXor = xbusXor(payload);
		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('produces consistent output for same address', () => {
		const result1 = encodeLanXSetLocoEStop(100);
		const result2 = encodeLanXSetLocoEStop(100);

		expect(result1).toEqual(result2);
	});

	it('produces different output for different addresses', () => {
		const result1 = encodeLanXSetLocoEStop(100);
		const result2 = encodeLanXSetLocoEStop(200);

		expect(result1).not.toEqual(result2);
	});

	it('throws error for address below 1', () => {
		expect(() => encodeLanXSetLocoEStop(0)).toThrow('Address');
	});

	it('throws error for address above 9999', () => {
		expect(() => encodeLanXSetLocoEStop(10000)).toThrow('Address');
	});

	it('throws error for negative address', () => {
		expect(() => encodeLanXSetLocoEStop(-1)).toThrow('Address');
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLanXSetLocoEStop(127);

		expect(result[5]).toBe(0x00);
		expect(result[6]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLanXSetLocoEStop(128);

		const addrHigh = 0xc0 | ((128 >> 8) & AddessByteMask.MSB);
		const addrLow = 128 & FULL_BYTE_MASK;
		expect(result[5]).toBe(addrHigh);
		expect(result[6]).toBe(addrLow);
	});
});
