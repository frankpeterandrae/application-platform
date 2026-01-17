/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21LanHeader } from '@application-platform/z21-shared';
import { describe, expect, it } from 'vitest';

import { FULL_BYTE_MASK } from '../constants';

import { parseZ21Datagram } from './codec';
import { xbusXor } from './frames';

const makeFrame = (header: number, payload: number[]): Buffer => {
	const len = payload.length + 4;
	const buf = Buffer.alloc(len);
	buf.writeUint16LE(len, 0);
	buf.writeUint16LE(header, 2);
	Buffer.from(payload).copy(buf, 4);
	return buf;
};

describe('parseZ21Datagram', () => {
	it('parses x.bus frame and strips trailing xor', () => {
		const payload = [0x10, 0x01, 0x02];
		const xor = xbusXor(payload);
		const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from([0x01, 0x02]) }]);
	});

	it('parses x.bus frame even when xor mismatches', () => {
		const payload = [0x21, 0x02, 0x03];
		const xor = (xbusXor(payload) + 1) & FULL_BYTE_MASK;
		const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

		const res = parseZ21Datagram(buf);

		expect(res[0]).toMatchObject({ kind: 'ds.bad_xor', calc: expect.any(String), recv: expect.any(String) });
	});

	it('parses system.state frame with 16-byte payload', () => {
		const payload = Array.from({ length: 16 }, (_, i) => i);
		const buf = makeFrame(Z21LanHeader.LAN_SYSTEMSTATE_DATACHANGED, payload);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([{ kind: 'ds.system.state', state: Uint8Array.from(payload) }]);
	});

	it('returns unknown for unrecognized header', () => {
		const payload = [0x01, 0x02];
		const buf = makeFrame(0x9999, payload);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([
			{ kind: 'ds.unknown', header: 0x9999, payload: Buffer.from(payload), reason: 'unrecognized header or invalid payload length' }
		]);
	});

	it('stops parsing on invalid length smaller than header size', () => {
		const buf = Buffer.from([0x01, 0x00]);
		expect(parseZ21Datagram(buf)).toEqual([]);
	});

	it('stops parsing when frame extends past buffer end', () => {
		const len = 10;
		const buf = Buffer.alloc(6);
		buf.writeUint16LE(len, 0);
		buf.writeUint16LE(Z21LanHeader.LAN_X, 2);
		// payload incomplete
		expect(parseZ21Datagram(buf)).toEqual([]);
	});

	it('parses multiple concatenated frames', () => {
		const payload1 = [0x10, 0x01];
		const xor1 = xbusXor(payload1);
		const frame1 = makeFrame(Z21LanHeader.LAN_X, [...payload1, xor1]);
		const payload2 = Array.from({ length: 16 }, (_, i) => i + 1);
		const frame2 = makeFrame(Z21LanHeader.LAN_SYSTEMSTATE_DATACHANGED, payload2);
		const buf = Buffer.concat([frame1, frame2]);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([
			{ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from([0x01]) },
			{ kind: 'ds.system.state', state: Uint8Array.from(payload2) }
		]);
	});

	it('returns unknown for x.bus frame with payload shorter than 2 bytes', () => {
		const buf = makeFrame(Z21LanHeader.LAN_X, [0x10]);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([{ kind: 'ds.unknown', header: Z21LanHeader.LAN_X, payload: Buffer.from([0x10]), reason: 'x-bus too short' }]);
	});
});
