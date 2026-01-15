/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi } from 'vitest';

import { FULL_BYTE_MASK, Z21LanHeader } from '../constants';

import { parseZ21Datagram } from './codec';

const makeFrame = (header: number, payload: number[]): Buffer => {
	const len = payload.length + 4;
	const buf = Buffer.alloc(len);
	buf.writeUint16LE(len, 0);
	buf.writeUint16LE(header, 2);
	Buffer.from(payload).copy(buf, 4);
	return buf;
};

const xor8 = (data: number[]): number => data.reduce((acc, b) => (acc ^ b) & FULL_BYTE_MASK, 0);

describe('parseZ21Datagram', () => {
	it('parses x.bus frame and strips trailing xor', () => {
		const payload = [0x10, 0x01, 0x02];
		const xor = xor8(payload);
		const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from(payload) }]);
	});

	it('parses x.bus frame even when xor mismatches', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
			// do nothing
		});
		const payload = [0x21, 0x02, 0x03];
		const xor = (xor8(payload) + 1) & FULL_BYTE_MASK;
		const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

		const res = parseZ21Datagram(buf);

		expect(res[0]).toEqual({ kind: 'ds.x.bus', xHeader: 0x21, data: Uint8Array.from(payload) });
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
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

		expect(res).toEqual([{ kind: 'ds.unknown', header: 0x9999, payload: Buffer.from(payload) }]);
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
		const xor1 = xor8(payload1);
		const frame1 = makeFrame(Z21LanHeader.LAN_X, [...payload1, xor1]);
		const payload2 = Array.from({ length: 16 }, (_, i) => i + 1);
		const frame2 = makeFrame(Z21LanHeader.LAN_SYSTEMSTATE_DATACHANGED, payload2);
		const buf = Buffer.concat([frame1, frame2]);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([
			{ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from(payload1) },
			{ kind: 'ds.system.state', state: Uint8Array.from(payload2) }
		]);
	});

	it('returns unknown for non-LAN_X message shorter than header', () => {
		// Implementation returns unknown for small frames rather than empty array; assert accordingly.
		const buf = Buffer.from([0x04, 0x00, 0x00, 0x00]);
		const parsed = parseZ21Datagram(buf);
		expect(parsed).toEqual([{ kind: 'ds.unknown', header: 0, payload: Buffer.from([]) }]);
	});

	it('parses LAN_X frame and returns xbus payload', () => {
		// Build buffer: len (2) + header (2) + payload + xor
		const payload = [0x21, 0x80];
		const len = 2 + 2 + payload.length + 1;
		const buf = Buffer.alloc(len);
		buf.writeUInt16LE(len, 0);
		buf.writeUInt16LE(Z21LanHeader.LAN_X, 2);
		buf.writeUInt8(payload[0], 4);
		buf.writeUInt8(payload[1], 5);
		// compute xor
		const xor = payload.reduce((acc, b) => (acc ^ b) & FULL_BYTE_MASK, 0);
		buf.writeUInt8(xor, len - 1);

		const parsed = parseZ21Datagram(buf);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].kind).toBe('ds.x.bus');
	});

	it('returns unknown for x.bus frame with payload shorter than 2 bytes', () => {
		const buf = makeFrame(Z21LanHeader.LAN_X, [0x10]);

		const res = parseZ21Datagram(buf);

		expect(res).toEqual([{ kind: 'ds.unknown', header: Z21LanHeader.LAN_X, payload: Buffer.from([0x10]) }]);
	});
});
