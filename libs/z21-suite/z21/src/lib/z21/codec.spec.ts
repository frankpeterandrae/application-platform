import { describe, expect, it } from 'vitest';

import { parseZ21Dataset } from './codec';

function makeFrame(header: number, payloadBytes: number[]) {
	const len = 4 + payloadBytes.length;
	const buf = Buffer.alloc(len);
	buf.writeUint16LE(len, 0);
	buf.writeUint16LE(header, 2);
	for (let i = 0; i < payloadBytes.length; i++) buf[4 + i] = payloadBytes[i];
	return buf;
}

describe('parseZ21Dataset', () => {
	it('parses a valid X-BUS frame when XOR matches and exposes xHeader and data without XOR', () => {
		const xHeader = 0x61;
		const body = [xHeader, 0x01];
		const xor = body.reduce((x, b) => x ^ b, 0) & 0xff;
		const payload = [...body, xor];
		const buf = makeFrame(0x0040, payload);

		const ds = parseZ21Dataset(buf);
		expect(ds).toHaveLength(1);
		expect(ds[0].kind).toBe('ds.x.bus');
		expect((ds[0] as any).xHeader).toBe(xHeader);
		expect(Array.from((ds[0] as any).data)).toEqual(body);
	});

	it('returns ds.x.bus even when XOR mismatches (visible for diagnostics)', () => {
		const xHeader = 0x61;
		const body = [xHeader, 0x02, 0x03];
		const wrongXor = 0x00;
		const payload = [...body, wrongXor];
		const buf = makeFrame(0x0040, payload);

		const ds = parseZ21Dataset(buf);
		expect(ds).toHaveLength(1);
		expect(ds[0].kind).toBe('ds.x.bus');
		expect(Array.from((ds[0] as any).data)).toEqual(body);
	});

	it('parses a systemState frame only when payload length is exactly 16', () => {
		const payload = Array.from({ length: 16 }, (_, i) => i & 0xff);
		const buf = makeFrame(0x0084, payload);

		const ds = parseZ21Dataset(buf);
		expect(ds).toHaveLength(1);
		expect(ds[0].kind).toBe('systemState');
		expect(Array.from((ds[0] as any).state)).toEqual(payload);
	});

	it('parses multiple concatenated frames in order', () => {
		const xBody = [0x61, 0x01];
		const xor = xBody.reduce((x, b) => x ^ b, 0) & 0xff;
		const frame1 = makeFrame(0x0040, [...xBody, xor]);
		const sysPayload = Array.from({ length: 16 }, (_, i) => 0xff - i);
		const frame2 = makeFrame(0x0084, sysPayload);
		const buf = Buffer.concat([frame1, frame2]);

		const ds = parseZ21Dataset(buf);
		expect(ds).toHaveLength(2);
		expect(ds[0].kind).toBe('ds.x.bus');
		expect(ds[1].kind).toBe('systemState');
	});

	it('stops parsing when encountering a frame with declared length < 4', () => {
		const bad = Buffer.alloc(4);
		bad.writeUint16LE(3, 0);
		bad.writeUint16LE(0x1234, 2);
		const ds = parseZ21Dataset(bad);
		expect(ds).toHaveLength(0);
	});

	it('parses earlier frames and stops at truncated frame that extends past buffer end', () => {
		const xBody = [0x61, 0x01];
		const xor = xBody.reduce((x, b) => x ^ b, 0) & 0xff;
		const frame1 = makeFrame(0x0040, [...xBody, xor]);
		const frame2 = makeFrame(0x0040, [0x10, 0x11, 0x22]);
		const partial = frame2.subarray(0, Math.max(0, frame2.length - 2));
		const buf = Buffer.concat([frame1, partial]);

		const ds = parseZ21Dataset(buf);
		expect(ds).toHaveLength(1);
		expect(ds[0].kind).toBe('ds.x.bus');
	});
});
