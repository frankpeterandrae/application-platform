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
		const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

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
		const frame2 = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload2);
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

	describe('hwinfo frame parsing', () => {
		it('parses hwinfo frame with hardware type 0x200 and firmware version 1.20', () => {
			const buf = Buffer.from([0x0c, 0x00, 0x1a, 0x00, 0x00, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00, 0x00]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000120 }]);
		});

		it('parses hwinfo frame with hardware type 0x201 and firmware version 2.30', () => {
			const payload = [0x01, 0x02, 0x00, 0x00, 0x30, 0x02, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000201, fwVersionBcd: 0x00000230 }]);
		});

		it('parses hwinfo frame with Z21_XL hardware type', () => {
			const payload = [0x11, 0x02, 0x00, 0x00, 0x45, 0x01, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000211, fwVersionBcd: 0x00000145 }]);
		});

		it('parses hwinfo frame with minimum values', () => {
			const payload = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000000, fwVersionBcd: 0x00000000 }]);
		});

		it('parses hwinfo frame with maximum values', () => {
			const payload = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0xffffffff, fwVersionBcd: 0xffffffff }]);
		});

		it('returns unknown for hwinfo frame with wrong payload length', () => {
			const payload = [0x00, 0x02, 0x00, 0x00, 0x20, 0x01];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{
					kind: 'ds.unknown',
					header: Z21LanHeader.LAN_GET_HWINFO,
					payload: Buffer.from(payload),
					reason: 'unrecognized header or invalid payload length'
				}
			]);
		});

		it('parses hwinfo frame with SMARTRAIL hardware type', () => {
			const payload = [0x02, 0x02, 0x00, 0x00, 0x50, 0x03, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000202, fwVersionBcd: 0x00000350 }]);
		});

		it('parses hwinfo frame with firmware version 9.99', () => {
			const payload = [0x00, 0x02, 0x00, 0x00, 0x99, 0x09, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000999 }]);
		});
	});

	describe('code frame parsing', () => {
		it('parses code frame with value 0', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x00]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0x00 }]);
		});

		it('parses code frame with value 255', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0xff]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0xff }]);
		});

		it('parses code frame with arbitrary value', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x42]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0x42 }]);
		});

		it('returns unknown for code frame with wrong payload length', () => {
			const payload = [0x01, 0x02];
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{
					kind: 'ds.unknown',
					header: Z21LanHeader.LAN_GET_CODE,
					payload: Buffer.from(payload),
					reason: 'unrecognized header or invalid payload length'
				}
			]);
		});

		it('returns unknown for code frame with empty payload', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, []);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{
					kind: 'ds.unknown',
					header: Z21LanHeader.LAN_GET_CODE,
					payload: Buffer.from([]),
					reason: 'unrecognized header or invalid payload length'
				}
			]);
		});
	});

	describe('x.bus edge cases', () => {
		it('parses x.bus frame with empty data after xHeader', () => {
			const payload = [0x10];
			const xor = xbusXor(payload);
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from([]) }]);
		});

		it('parses x.bus frame with single data byte', () => {
			const payload = [0x21, 0x24];
			const xor = xbusXor(payload);
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x21, data: Uint8Array.from([0x24]) }]);
		});

		it('parses x.bus frame with multiple data bytes', () => {
			const payload = [0x61, 0x00, 0x01, 0x02, 0x03];
			const xor = xbusXor(payload);
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x61, data: Uint8Array.from([0x00, 0x01, 0x02, 0x03]) }]);
		});

		it('emits bad_xor before x.bus when xor mismatches', () => {
			const payload = [0x10, 0x01];
			const xor = (xbusXor(payload) + 1) & FULL_BYTE_MASK;
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(2);
			expect(res[0].kind).toBe('ds.bad_xor');
			expect(res[1].kind).toBe('ds.x.bus');
		});

		it('returns unknown for x.bus frame with only xHeader byte', () => {
			const buf = makeFrame(Z21LanHeader.LAN_X, [0x10]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{ kind: 'ds.unknown', header: Z21LanHeader.LAN_X, payload: Buffer.from([0x10]), reason: 'x-bus too short' }
			]);
		});

		it('returns unknown for x.bus frame with empty payload', () => {
			const buf = makeFrame(Z21LanHeader.LAN_X, []);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.unknown', header: Z21LanHeader.LAN_X, payload: Buffer.from([]), reason: 'x-bus too short' }]);
		});
	});

	describe('system.state edge cases', () => {
		it('returns unknown for system.state with 15 bytes', () => {
			const payload = Array.from({ length: 15 }, (_, i) => i);
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{
					kind: 'ds.unknown',
					header: Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED,
					payload: Buffer.from(payload),
					reason: 'unrecognized header or invalid payload length'
				}
			]);
		});

		it('returns unknown for system.state with 17 bytes', () => {
			const payload = Array.from({ length: 17 }, (_, i) => i);
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{
					kind: 'ds.unknown',
					header: Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED,
					payload: Buffer.from(payload),
					reason: 'unrecognized header or invalid payload length'
				}
			]);
		});

		it('parses system.state with all maximum values', () => {
			const payload = Array.from({ length: 16 }, () => 0xff);
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.system.state', state: Uint8Array.from(payload) }]);
		});

		it('parses system.state with alternating values', () => {
			const payload = Array.from({ length: 16 }, (_, i) => (i % 2 === 0 ? 0xaa : 0x55));
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.system.state', state: Uint8Array.from(payload) }]);
		});
	});

	describe('buffer boundary conditions', () => {
		it('stops parsing at exact buffer end', () => {
			const payload = [0x10];
			const xor = xbusXor(payload);
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(1);
		});

		it('handles frame with length exactly 4 bytes', () => {
			const buf = Buffer.alloc(4);
			buf.writeUint16LE(4, 0);
			buf.writeUint16LE(0x9999, 2);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{ kind: 'ds.unknown', header: 0x9999, payload: Buffer.from([]), reason: 'unrecognized header or invalid payload length' }
			]);
		});

		it('handles buffer with multiple frames ending at exact boundary', () => {
			const frame1 = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x10]);
			const frame2 = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x20]);
			const buf = Buffer.concat([frame1, frame2]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(2);
			expect(res[0]).toEqual({ kind: 'ds.code', code: 0x10 });
			expect(res[1]).toEqual({ kind: 'ds.code', code: 0x20 });
		});

		it('stops parsing when declared length would exceed buffer', () => {
			const buf = Buffer.alloc(10);
			buf.writeUint16LE(20, 0);
			buf.writeUint16LE(Z21LanHeader.LAN_X, 2);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('stops parsing when length is 0', () => {
			const buf = Buffer.alloc(4);
			buf.writeUint16LE(0, 0);
			buf.writeUint16LE(Z21LanHeader.LAN_X, 2);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('stops parsing when length is 3', () => {
			const buf = Buffer.alloc(4);
			buf.writeUint16LE(3, 0);
			buf.writeUint16LE(Z21LanHeader.LAN_X, 2);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('handles empty buffer', () => {
			const buf = Buffer.alloc(0);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('handles buffer with only 1 byte', () => {
			const buf = Buffer.from([0x00]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('handles buffer with only 3 bytes', () => {
			const buf = Buffer.from([0x04, 0x00, 0x40]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});
	});

	describe('xor validation behavior', () => {
		it('includes both bad_xor and x.bus datasets when xor is incorrect', () => {
			const payload = [0x61, 0x82, 0x03];
			const wrongXor = (xbusXor(payload) + 5) & FULL_BYTE_MASK;
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, wrongXor]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(2);
			expect(res[0]).toMatchObject({ kind: 'ds.bad_xor' });
			expect(res[1]).toMatchObject({ kind: 'ds.x.bus', xHeader: 0x61, data: Uint8Array.from([0x82, 0x03]) });
		});

		it('formats xor values as hexadecimal strings in bad_xor dataset', () => {
			const payload = [0xaa, 0xbb];
			const correctXor = xbusXor(payload);
			const wrongXor = (correctXor + 1) & FULL_BYTE_MASK;
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, wrongXor]);

			const res = parseZ21Datagram(buf);

			expect(res[0].kind).toBe('ds.bad_xor');
			if (res[0].kind === 'ds.bad_xor') {
				expect(typeof res[0].calc).toBe('string');
				expect(typeof res[0].recv).toBe('string');
				expect(res[0].calc).toMatch(/^[0-9a-f]+$/);
				expect(res[0].recv).toMatch(/^[0-9a-f]+$/);
			}
		});

		it('still delivers x.bus data when xor check fails', () => {
			const payload = [0x43, 0x11, 0x22, 0x33];
			const wrongXor = 0x00;
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, wrongXor]);

			const res = parseZ21Datagram(buf);

			const xbusDataset = res.find((d) => d.kind === 'ds.x.bus');
			expect(xbusDataset).toBeDefined();
			if (xbusDataset && xbusDataset.kind === 'ds.x.bus') {
				expect(xbusDataset.xHeader).toBe(0x43);
				expect(xbusDataset.data).toEqual(Uint8Array.from([0x11, 0x22, 0x33]));
			}
		});
	});

	describe('hwinfo byte order and encoding', () => {
		it('reads hwtype as little-endian uint32 from first 4 bytes', () => {
			const payload = [0x11, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toEqual({ kind: 'ds.hwinfo', hwtype: 0x00000211, fwVersionBcd: 0x00000000 });
		});

		it('reads fwVersionBcd as little-endian uint32 from last 4 bytes', () => {
			const payload = [0x00, 0x00, 0x00, 0x00, 0x45, 0x01, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toEqual({ kind: 'ds.hwinfo', hwtype: 0x00000000, fwVersionBcd: 0x00000145 });
		});

		it('handles hwinfo with non-zero high bytes', () => {
			const payload = [0xff, 0xff, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toEqual({ kind: 'ds.hwinfo', hwtype: 0x0000ffff, fwVersionBcd: 0x0000ffff });
		});

		it('returns unknown for hwinfo with 7 bytes', () => {
			const payload = [0x00, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0].kind).toBe('ds.unknown');
		});

		it('returns unknown for hwinfo with 9 bytes', () => {
			const payload = [0x00, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00, 0x00, 0xff];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0].kind).toBe('ds.unknown');
		});
	});

	describe('code frame byte extraction', () => {
		it('extracts single byte value from code payload', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x7f]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0x7f }]);
		});

		it('preserves code value 1', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x01]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0x01 }]);
		});

		it('preserves code value 254', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0xfe]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0xfe }]);
		});
	});

	describe('frame type precedence and branching', () => {
		it('prioritizes LAN_X header check first', () => {
			const payload = [0x61, 0x00];
			const xor = xbusXor(payload);
			const buf = makeFrame(Z21LanHeader.LAN_X, [...payload, xor]);

			const res = parseZ21Datagram(buf);

			expect(res[0].kind).toBe('ds.x.bus');
		});

		it('processes system.state when header matches and length is exactly 16', () => {
			const payload = Array.from({ length: 16 }, (_, i) => i * 16);
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toEqual({ kind: 'ds.system.state', state: Uint8Array.from(payload) });
		});

		it('processes hwinfo when header matches and length is exactly 8', () => {
			const payload = [0x03, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0].kind).toBe('ds.hwinfo');
		});

		it('processes code when header matches and length is exactly 1', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x99]);

			const res = parseZ21Datagram(buf);

			expect(res[0].kind).toBe('ds.code');
		});

		it('returns unknown for any other header regardless of payload', () => {
			const buf = makeFrame(0xabcd, [0x01, 0x02, 0x03]);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.unknown', header: 0xabcd });
		});
	});

	describe('mixed valid and invalid frames', () => {
		it('parses valid frame then stops at invalid frame', () => {
			const validFrame = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x42]);
			const invalidBuf = Buffer.alloc(4);
			invalidBuf.writeUint16LE(100, 0);
			invalidBuf.writeUint16LE(0x9999, 2);
			const buf = Buffer.concat([validFrame, invalidBuf]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(1);
			expect(res[0]).toEqual({ kind: 'ds.code', code: 0x42 });
		});

		it('parses multiple valid frames with different types', () => {
			const frame1 = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x10]);
			const frame2 = makeFrame(Z21LanHeader.LAN_GET_HWINFO, [0x00, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00, 0x00]);
			const payload3 = [0x61, 0x00];
			const frame3 = makeFrame(Z21LanHeader.LAN_X, [...payload3, xbusXor(payload3)]);
			const buf = Buffer.concat([frame1, frame2, frame3]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(3);
			expect(res[0].kind).toBe('ds.code');
			expect(res[1].kind).toBe('ds.hwinfo');
			expect(res[2].kind).toBe('ds.x.bus');
		});
	});

	describe('multiple frame combinations', () => {
		it('parses hwinfo followed by system state frame', () => {
			const hwinfoPayload = [0x00, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00, 0x00];
			const frame1 = makeFrame(Z21LanHeader.LAN_GET_HWINFO, hwinfoPayload);
			const statePayload = Array.from({ length: 16 }, (_, i) => i);
			const frame2 = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, statePayload);
			const buf = Buffer.concat([frame1, frame2]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000120 },
				{ kind: 'ds.system.state', state: Uint8Array.from(statePayload) }
			]);
		});

		it('parses code followed by x.bus frame', () => {
			const frame1 = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x42]);
			const xbusPayload = [0x21, 0x24];
			const xor = xbusXor(xbusPayload);
			const frame2 = makeFrame(Z21LanHeader.LAN_X, [...xbusPayload, xor]);
			const buf = Buffer.concat([frame1, frame2]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([
				{ kind: 'ds.code', code: 0x42 },
				{ kind: 'ds.x.bus', xHeader: 0x21, data: Uint8Array.from([0x24]) }
			]);
		});

		it('parses all frame types in sequence', () => {
			const codeFrame = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x10]);
			const hwinfoFrame = makeFrame(Z21LanHeader.LAN_GET_HWINFO, [0x00, 0x02, 0x00, 0x00, 0x20, 0x01, 0x00, 0x00]);
			const stateFrame = makeFrame(
				Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED,
				Array.from({ length: 16 }, (_, i) => i)
			);
			const xbusPayload = [0x61, 0x00];
			const xbusFrame = makeFrame(Z21LanHeader.LAN_X, [...xbusPayload, xbusXor(xbusPayload)]);
			const buf = Buffer.concat([codeFrame, hwinfoFrame, stateFrame, xbusFrame]);

			const res = parseZ21Datagram(buf);

			expect(res.length).toBe(4);
			expect(res[0]).toEqual({ kind: 'ds.code', code: 0x10 });
			expect(res[1]).toEqual({ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000120 });
			expect(res[2].kind).toBe('ds.system.state');
			expect(res[3].kind).toBe('ds.x.bus');
		});
	});
});
