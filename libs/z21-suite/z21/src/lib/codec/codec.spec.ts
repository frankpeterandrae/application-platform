/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21LanHeader } from '@application-platform/z21-shared';
import { describe, expect, it } from 'vitest';

import { FULL_BYTE_MASK } from '../constants';

import { parseZ21Datagram } from './codec';
import { xbusXor } from './frames';

describe('parseZ21Datagram', () => {
	// Helper function to create Z21 frame (similar to helper functions in bootstrap.spec.ts)
	function makeFrame(header: number, payload: number[]): Buffer {
		const len = payload.length + 4;
		const buf = Buffer.alloc(len);
		buf.writeUint16LE(len, 0);
		buf.writeUint16LE(header, 2);
		Buffer.from(payload).copy(buf, 4);
		return buf;
	}

	// Helper function to create X-Bus payload with correct XOR
	function makeXBusPayload(payload: number[]): number[] {
		return [...payload, xbusXor(payload)];
	}

	// Helper function to create X-Bus payload with invalid XOR
	function makeXBusPayloadWithBadXor(payload: number[]): number[] {
		return [...payload, (xbusXor(payload) + 1) & FULL_BYTE_MASK];
	}

	// Helper function to create system state payload (16 bytes)
	function makeSystemStatePayload(): number[] {
		return Array.from({ length: 16 }, (_, i) => i);
	}

	// Helper function to create hardware info payload (8 bytes)
	function makeHWInfoPayload(hwtype: number, fwVersionBcd: number): number[] {
		const buf = Buffer.alloc(8);
		buf.writeUint32LE(hwtype, 0);
		buf.writeUint32LE(fwVersionBcd, 4);
		return Array.from(buf);
	}

	describe('X-Bus frame parsing', () => {
		it('parses x.bus frame and strips trailing xor', () => {
			const payload = [0x10, 0x01, 0x02];
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload(payload));

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from([0x01, 0x02]) }]);
		});

		it('parses x.bus frame and reports bad xor', () => {
			const payload = [0x21, 0x02, 0x03];
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayloadWithBadXor(payload));

			const res = parseZ21Datagram(buf);

			expect(res).toHaveLength(2);
			expect(res[0]).toMatchObject({ kind: 'ds.bad_xor', calc: expect.any(String), recv: expect.any(String) });
			expect(res[1]).toEqual({ kind: 'ds.x.bus', xHeader: 0x21, data: Uint8Array.from([0x02, 0x03]) });
		});

		it('parses x.bus frame with empty data', () => {
			const payload = [0x62];
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload(payload));

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x62, data: Uint8Array.from([]) }]);
		});

		it('handles malformed x.bus frame (too shortCircuit)', () => {
			const buf = makeFrame(Z21LanHeader.LAN_X, []);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.unknown', reason: 'x-bus too shortCircuit' });
		});

		it('parses x.bus frame with multiple data bytes', () => {
			const payload = [0x40, 0x00, 0x01, 0x02, 0x03, 0x04];
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload(payload));

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x40, data: Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04]) }]);
		});
	});

	describe('System state frame parsing', () => {
		it('parses system.state frame with 16-byte payload', () => {
			const payload = makeSystemStatePayload();
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.system.state', state: Uint8Array.from(payload) }]);
		});

		it('handles system.state frame with wrong payload length', () => {
			const payload = [0x01, 0x02, 0x03];
			const buf = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.unknown', reason: 'unrecognized header or invalid payload length' });
		});
	});

	describe('Hardware info frame parsing', () => {
		it('parses hardware info frame', () => {
			const payload = makeHWInfoPayload(0x00000201, 0x01230000);
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0x00000201, fwVersionBcd: 0x01230000 }]);
		});

		it('handles hardware info with wrong payload length', () => {
			const payload = [0x01, 0x02];
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.unknown', reason: 'unrecognized header or invalid payload length' });
		});
	});

	describe('Code frame parsing', () => {
		it('parses code frame', () => {
			const payload = [0x42];
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, payload);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.code', code: 0x42 }]);
		});

		it('handles code frame with wrong payload length', () => {
			const payload = [0x01, 0x02];
			const buf = makeFrame(Z21LanHeader.LAN_GET_CODE, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.unknown', reason: 'unrecognized header or invalid payload length' });
		});
	});

	describe('Unknown and malformed frames', () => {
		it('returns unknown for unrecognized header', () => {
			const payload = [0x01, 0x02];
			const buf = makeFrame(0x9999, payload);

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.unknown', reason: 'unrecognized header or invalid payload length' });
		});

		it('handles empty buffer', () => {
			const buf = Buffer.alloc(0);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('handles buffer too shortCircuit for header', () => {
			const buf = Buffer.from([0x04, 0x00]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('handles buffer with length mismatch', () => {
			const buf = Buffer.from([0x10, 0x00, 0x40, 0x00, 0x01, 0x02]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('stops parsing on invalid frame length (< 4)', () => {
			const buf = Buffer.from([0x03, 0x00, 0x40, 0x00]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});

		it('stops parsing when frame extends past buffer end', () => {
			const buf = Buffer.from([0x08, 0x00, 0x40, 0x00, 0x01]);

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([]);
		});
	});

	describe('Multiple frames in single buffer', () => {
		it('parses multiple frames concatenated in one buffer', () => {
			const frame1 = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload([0x10, 0x01]));
			const frame2 = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload([0x20, 0x02]));
			const buf = Buffer.concat([frame1, frame2]);

			const res = parseZ21Datagram(buf);

			expect(res).toHaveLength(2);
			expect(res[0]).toEqual({ kind: 'ds.x.bus', xHeader: 0x10, data: Uint8Array.from([0x01]) });
			expect(res[1]).toEqual({ kind: 'ds.x.bus', xHeader: 0x20, data: Uint8Array.from([0x02]) });
		});

		it('handles mix of valid and invalid frames', () => {
			const frame1 = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload([0x30, 0x03]));
			const frame2 = makeFrame(0x9999, [0x01, 0x02]);
			const buf = Buffer.concat([frame1, frame2]);

			const res = parseZ21Datagram(buf);

			expect(res).toHaveLength(2);
			expect(res[0]).toEqual({ kind: 'ds.x.bus', xHeader: 0x30, data: Uint8Array.from([0x03]) });
			expect(res[1]).toMatchObject({ kind: 'ds.unknown' });
		});

		it('parses mix of different supported frame types', () => {
			const frame1 = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload([0x10, 0x01]));
			const frame2 = makeFrame(Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED, makeSystemStatePayload());
			const frame3 = makeFrame(Z21LanHeader.LAN_GET_CODE, [0x42]);
			const buf = Buffer.concat([frame1, frame2, frame3]);

			const res = parseZ21Datagram(buf);

			expect(res).toHaveLength(3);
			expect(res[0]).toMatchObject({ kind: 'ds.x.bus' });
			expect(res[1]).toMatchObject({ kind: 'ds.system.state' });
			expect(res[2]).toMatchObject({ kind: 'ds.code' });
		});
	});

	describe('Edge cases', () => {
		it('handles frame with maximum valid x.bus payload', () => {
			const payload = Array.from({ length: 100 }, (_, i) => i % 256);
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload([0x40, ...payload]));

			const res = parseZ21Datagram(buf);

			expect(res[0]).toMatchObject({ kind: 'ds.x.bus', xHeader: 0x40 });
			if (res[0].kind === 'ds.x.bus') {
				expect(res[0].data).toHaveLength(payload.length);
			}
		});

		it('handles frame with all zero payload', () => {
			const payload = [0x00, 0x00, 0x00];
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload(payload));

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0x00, data: Uint8Array.from([0x00, 0x00]) }]);
		});

		it('handles frame with all 0xFF payload', () => {
			const payload = [0xff, 0xff, 0xff];
			const buf = makeFrame(Z21LanHeader.LAN_X, makeXBusPayload(payload));

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.x.bus', xHeader: 0xff, data: Uint8Array.from([0xff, 0xff]) }]);
		});

		it('handles hardware info with various hwtype values', () => {
			const buf = makeFrame(Z21LanHeader.LAN_GET_HWINFO, makeHWInfoPayload(0xffffffff, 0x12345678));

			const res = parseZ21Datagram(buf);

			expect(res).toEqual([{ kind: 'ds.hwinfo', hwtype: 0xffffffff, fwVersionBcd: 0x12345678 }]);
		});
	});
});
