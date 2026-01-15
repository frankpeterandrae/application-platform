/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { TrackPowerValue, XBusHeader, Z21LanHeader } from '../constants';

import { encodeLanX, encodeLanXSetTrackPowerOff, encodeLanXSetTrackPowerOn, encodeLocoDrive128, xbusXor } from './frames';

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
		const bytes = [0xff, 0xff];
		expect(xbusXor(bytes)).toBe(0);
	});

	it('handles large arrays of bytes', () => {
		const bytes = Array.from({ length: 100 }, (_, i) => i & 0xff);
		const expected = bytes.reduce((acc, b) => (acc ^ b) & 0xff, 0);
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
		const xbus = [0x21];
		const result = encodeLanX(xbus);

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result.length).toBe(6); // 2 (len) + 2 (header) + 1 (xbus) + 1 (xor)
	});

	it('writes correct data length at start', () => {
		const xbus = [0x21, 0x80];
		const result = encodeLanX(xbus);
		const len = result.readUInt16LE(0);

		expect(len).toBe(result.length);
	});

	it('writes LAN_X header at correct position', () => {
		const xbus = [0x21, 0x80];
		const result = encodeLanX(xbus);
		const header = result.readUInt16LE(2);

		expect(header).toBe(Z21LanHeader.LAN_X);
	});

	it('copies xbus payload to correct position', () => {
		const xbus = [0x21, 0x80];
		const result = encodeLanX(xbus);

		expect(result[4]).toBe(0x21);
		expect(result[5]).toBe(0x80);
	});

	it('writes xor checksum at end', () => {
		const xbus = [0x21, 0x80];
		const result = encodeLanX(xbus);
		const expectedXor = xbusXor(xbus);

		expect(result[result.length - 1]).toBe(expectedXor);
	});

	it('handles large xbus payloads', () => {
		const xbus = Array.from({ length: 100 }, (_, i) => i & 0xff);
		const result = encodeLanX(xbus);

		expect(result.length).toBe(2 + 2 + xbus.length + 1);
		expect(result.readUInt16LE(0)).toBe(result.length);
	});

	it('encodes track power command correctly', () => {
		const xbus = [XBusHeader.TrackPower, TrackPowerValue.On];
		const result = encodeLanX(xbus);

		expect(result.length).toBe(7);
		expect(result[4]).toBe(XBusHeader.TrackPower);
		expect(result[5]).toBe(TrackPowerValue.On);
	});

	it('produces different output for different payloads', () => {
		const result1 = encodeLanX([0x21, 0x80]);
		const result2 = encodeLanX([0x21, 0x81]);

		expect(result1).not.toEqual(result2);
	});

	it('produces consistent output for identical input', () => {
		const xbus = [0x21, 0x80];
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

	it('includes TrackPower xbus header', () => {
		const result = encodeLanXSetTrackPowerOff();

		expect(result[4]).toBe(XBusHeader.TrackPower);
	});

	it('includes Off track power value', () => {
		const result = encodeLanXSetTrackPowerOff();

		expect(result[5]).toBe(TrackPowerValue.Off);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTrackPowerOff();
		const payload = [XBusHeader.TrackPower, TrackPowerValue.Off];
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

	it('includes TrackPower xbus header', () => {
		const result = encodeLanXSetTrackPowerOn();

		expect(result[4]).toBe(XBusHeader.TrackPower);
	});

	it('includes On track power value', () => {
		const result = encodeLanXSetTrackPowerOn();

		expect(result[5]).toBe(TrackPowerValue.On);
	});

	it('includes valid xor checksum', () => {
		const result = encodeLanXSetTrackPowerOn();
		const payload = [XBusHeader.TrackPower, TrackPowerValue.On];
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

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
		expect(result[4]).toBe(XBusHeader.LocoDrive);
		expect(result[5]).toBe(0x13);
	});

	it('encodes reverse direction with zero speed', () => {
		const result = encodeLocoDrive128(3, 0, 'REV');

		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result[4]).toBe(XBusHeader.LocoDrive);
	});

	it('encodes minimum valid address', () => {
		const result = encodeLocoDrive128(1, 10, 'FWD');

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x01);
	});

	it('encodes maximum valid address', () => {
		const result = encodeLocoDrive128(9999, 10, 'FWD');

		const addrHigh = (9999 >> 8) & 0x3f;
		const addrLow = 9999 & 0xff;
		expect(result[6]).toBe(addrHigh);
		expect(result[7]).toBe(addrLow);
	});

	it('encodes minimum speed step', () => {
		const result = encodeLocoDrive128(100, 1, 'FWD');

		const speedByte = result[8];
		expect(speedByte & 0x7f).toBe(2);
	});

	it('encodes maximum speed step', () => {
		const result = encodeLocoDrive128(100, 126, 'FWD');

		const speedByte = result[8];
		expect(speedByte & 0x7f).toBe(127);
	});

	it('clamps speed above 126 to 126', () => {
		const result = encodeLocoDrive128(100, 127, 'FWD');

		const speedByte = result[8];
		expect(speedByte & 0x7f).toBe(127);
	});

	it('encodes forward direction with high bit set', () => {
		const result = encodeLocoDrive128(100, 50, 'FWD');

		const speedByte = result[8];
		expect(speedByte & 0x80).toBe(0x80);
	});

	it('encodes reverse direction with high bit clear', () => {
		const result = encodeLocoDrive128(100, 50, 'REV');

		const speedByte = result[8];
		expect(speedByte & 0x80).toBe(0x00);
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

		const expectedHigh = (1000 >> 8) & 0x3f;
		const expectedLow = 1000 & 0xff;
		expect(result[6]).toBe(expectedHigh);
		expect(result[7]).toBe(expectedLow);
	});

	it('masks address high byte to 6 bits', () => {
		const result = encodeLocoDrive128(9999, 50, 'FWD');

		const addrHigh = result[6];
		expect(addrHigh).toBeLessThanOrEqual(0x3f);
	});

	it('encodes mid-range speed correctly', () => {
		const result = encodeLocoDrive128(100, 63, 'FWD');

		const speedByte = result[8];
		expect(speedByte & 0x7f).toBe(64);
	});

	it('handles boundary case with address 127', () => {
		const result = encodeLocoDrive128(127, 50, 'FWD');

		expect(result[6]).toBe(0x00);
		expect(result[7]).toBe(0x7f);
	});

	it('handles boundary case with address 128', () => {
		const result = encodeLocoDrive128(128, 50, 'FWD');

		const expectedHigh = (128 >> 8) & 0x3f;
		const expectedLow = 128 & 0xff;
		expect(result[6]).toBe(expectedHigh);
		expect(result[7]).toBe(expectedLow);
	});
});
