/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { TrackPowerValue, XBusHeader, Z21LanHeader } from '../constants';

import { encodeLanX, encodeLanXSetTrackPowerOff, encodeLanXSetTrackPowerOn, xbusXor } from './frames';

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
