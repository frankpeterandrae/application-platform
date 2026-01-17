/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21LanHeader } from '@application-platform/z21-shared';

import { encodeXBusLanFrame } from './x-bus-encoder';

describe('encodeXBusLanFrame', () => {
	it('encodes no-payload frame as LAN_X followed by header', () => {
		const buf = encodeXBusLanFrame(Z21LanHeader.LAN_GET_SERIAL_NUMBER);
		expect(buf.length).toBe(4);
		expect(buf.readUInt16LE(0)).toBe(0x0004);
		expect(buf.readUInt16LE(2)).toBe(Z21LanHeader.LAN_GET_SERIAL_NUMBER);
	});

	it('encodes payload frame with length prefix and copies payload', () => {
		const payload = Buffer.from([0x01, 0x02, 0x03, 0x04]);
		const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;
		const buf = encodeXBusLanFrame(header, payload);
		expect(buf.readUInt16LE(0)).toBe(4 + payload.length);
		expect(buf.readUInt16LE(2)).toBe(header);
		expect(buf.subarray(4).equals(payload)).toBe(true);
	});

	it('treats empty Buffer same as undefined (produces 4-byte LAN_X frame)', () => {
		const bufWithEmpty = encodeXBusLanFrame(Z21LanHeader.LAN_GET_SERIAL_NUMBER, Buffer.alloc(0));
		const bufWithout = encodeXBusLanFrame(Z21LanHeader.LAN_GET_SERIAL_NUMBER);
		expect(bufWithEmpty.length).toBe(4);
		expect(bufWithEmpty.readUInt16LE(0)).toBe(0x0004);
		expect(bufWithEmpty.readUInt16LE(2)).toBe(Z21LanHeader.LAN_GET_SERIAL_NUMBER);
		expect(bufWithEmpty.equals(bufWithout)).toBe(true);
	});
});
