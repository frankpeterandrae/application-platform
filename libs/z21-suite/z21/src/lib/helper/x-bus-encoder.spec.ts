/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Z21LanHeader } from '../constants';

import { encodeXBusLanFrame } from './x-bus-encoder';

describe('encodeXBusLanFrame', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidFrameStructure(buffer: Buffer, expectedLength: number, expectedHeader: number): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.length).toBe(expectedLength);
		expect(buffer.readUInt16LE(0)).toBe(expectedLength);
		expect(buffer.readUInt16LE(2)).toBe(expectedHeader);
	}

	// Helper function to extract payload from frame
	function extractPayload(buffer: Buffer): Buffer {
		return buffer.subarray(4);
	}

	// Helper function to create test payload
	function makeTestPayload(bytes: number[]): Buffer {
		return Buffer.from(bytes);
	}

	// Helper function to verify payload matches
	function expectPayloadMatches(buffer: Buffer, expectedPayload: Buffer): void {
		const actualPayload = extractPayload(buffer);
		expect(actualPayload.equals(expectedPayload)).toBe(true);
	}

	describe('frame without payload', () => {
		it('encodes no-payload frame as LAN_X followed by header', () => {
			const header = Z21LanHeader.LAN_GET_SERIAL;

			const buf = encodeXBusLanFrame(header);

			expectValidFrameStructure(buf, 4, header);
		});

		it('produces 4-byte frame with correct length field', () => {
			const header = Z21LanHeader.LAN_GET_SERIAL;

			const buf = encodeXBusLanFrame(header);

			expect(buf.readUInt16LE(0)).toBe(0x0004);
		});

		it('treats empty Buffer same as undefined (produces 4-byte frame)', () => {
			const header = Z21LanHeader.LAN_GET_SERIAL;
			const bufWithEmpty = encodeXBusLanFrame(header, Buffer.alloc(0));
			const bufWithout = encodeXBusLanFrame(header);

			expect(bufWithEmpty.length).toBe(4);
			expect(bufWithEmpty.equals(bufWithout)).toBe(true);
		});
	});

	describe('frame with payload', () => {
		it('encodes payload frame with length prefix and copies payload', () => {
			const payload = makeTestPayload([0x01, 0x02, 0x03, 0x04]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expectValidFrameStructure(buf, 4 + payload.length, header);
			expectPayloadMatches(buf, payload);
		});

		it('correctly calculates total length including payload', () => {
			const payload = makeTestPayload([0xaa, 0xbb, 0xcc]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expect(buf.readUInt16LE(0)).toBe(4 + payload.length);
		});

		it('copies payload bytes correctly', () => {
			const payload = makeTestPayload([0x01, 0x02, 0x03, 0x04]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expectPayloadMatches(buf, payload);
		});

		it('handles single-byte payload', () => {
			const payload = makeTestPayload([0x42]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expectValidFrameStructure(buf, 5, header);
			expectPayloadMatches(buf, payload);
		});

		it('handles large payload', () => {
			const payload = makeTestPayload(Array.from({ length: 100 }, (_, i) => i % 256));
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expectValidFrameStructure(buf, 4 + payload.length, header);
			expectPayloadMatches(buf, payload);
		});
	});

	describe('edge cases', () => {
		it('handles payload with all zero bytes', () => {
			const payload = makeTestPayload([0x00, 0x00, 0x00]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expectPayloadMatches(buf, payload);
		});

		it('handles payload with all 0xFF bytes', () => {
			const payload = makeTestPayload([0xff, 0xff, 0xff]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expectPayloadMatches(buf, payload);
		});

		it('handles header value 0x0000', () => {
			const header = 0x0000;

			const buf = encodeXBusLanFrame(header);

			expectValidFrameStructure(buf, 4, header);
		});

		it('handles header value 0xFFFF', () => {
			const header = 0xffff;

			const buf = encodeXBusLanFrame(header);

			expectValidFrameStructure(buf, 4, header);
		});

		it('produces independent buffers for multiple calls', () => {
			const header = Z21LanHeader.LAN_GET_SERIAL;

			const buf1 = encodeXBusLanFrame(header);
			const buf2 = encodeXBusLanFrame(header);

			expect(buf1).not.toBe(buf2); // Different buffer instances
			expect(buf1.equals(buf2)).toBe(true); // But same content
		});
	});

	describe('frame structure validation', () => {
		it('writes length field in little-endian at offset 0', () => {
			const payload = makeTestPayload([0x01, 0x02]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			const length = buf.readUInt16LE(0);
			expect(length).toBe(6); // 2 + 2 + 2
		});

		it('writes header field in little-endian at offset 2', () => {
			const header = 0x1234;

			const buf = encodeXBusLanFrame(header);

			const readHeader = buf.readUInt16LE(2);
			expect(readHeader).toBe(0x1234);
		});

		it('places payload immediately after header at offset 4', () => {
			const payload = makeTestPayload([0xaa, 0xbb, 0xcc]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			expect(buf[4]).toBe(0xaa);
			expect(buf[5]).toBe(0xbb);
			expect(buf[6]).toBe(0xcc);
		});

		it('frame length equals actual buffer size', () => {
			const payload = makeTestPayload([0x01, 0x02, 0x03]);
			const header = Z21LanHeader.LAN_SET_BROADCASTFLAGS;

			const buf = encodeXBusLanFrame(header, payload);

			const lengthField = buf.readUInt16LE(0);
			expect(lengthField).toBe(buf.length);
		});
	});
});
