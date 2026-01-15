/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21LanHeader } from '../constants';

import type { Z21Dataset } from './codec-types';

/**
 * Parse a Buffer of one or more concatenated Z21 frames into structured datasets.
 *
 * Z21 frame layout:
 * - [0..1]  uint16 LE: total length of the frame (including length + header + payload)
 * - [2..3]  uint16 LE: Z21 header / command code
 * - [4..N]  payload: depends on header
 *
 * Recognized headers:
 * - 0x0040: X-BUS tunneling. Payload = [XHeader, DB..., XOR]
 *   - Returns kind 'ds.x.bus', with `xHeader` extracted and `data` excluding the trailing XOR byte.
 *   - Logs a warning if computed XOR of [XHeader, DB...] doesn't match the final XOR byte, but still returns the dataset.
 * - 0x0084: System state. Payload must be exactly 16 bytes. Returns kind 'ds.system.state'.
 *
 * Any other header (or malformed payload) yields kind 'ds.unknown' to aid debugging and visibility of unexpected data.
 *
 * Parsing rules and safety:
 * - Stops if a frame claims a length < 4 (minimum header size) or extends past buffer end.
 * - Iterates through the buffer by advancing the offset by each frame's `len`.
 *
 * @param buf Node.js Buffer containing one or more Z21 frames back-to-back.
 * @returns Array of decoded Z21Dataset objects.
 */
export function parseZ21Datagram(buf: Buffer): Z21Dataset[] {
	const out: Z21Dataset[] = [];
	let offset = 0;

	while (offset + 4 <= buf.length) {
		const len = buf.readUint16LE(offset);
		if (len < 4 || offset + len > buf.length) {
			// Invalid or truncated frame: stop parsing to avoid reading past end.
			break;
		}

		const header = buf.readUint16LE(offset + 2);
		const payload = buf.subarray(offset + 4, offset + len);

		if (header === Z21LanHeader.LAN_X) {
			// X-BUS tunneling: payload = [XHeader, DB..., XOR]
			if (payload.length >= 2) {
				const xHeader = payload[0];
				const bodyWithXor = payload.subarray(0);
				const bodyNoXor = bodyWithXor.subarray(0, bodyWithXor.length - 1);
				const xorByte = bodyWithXor[bodyWithXor.length - 1];

				const calc = xor8(bodyNoXor);
				// XOR check: if false, deliver anyway (you want to see UDP drops/bugs)
				if (calc !== xorByte) {
					// eslint-disable-next-line no-console
					console.warn(`[z21] X-BUS XOR mismatch: calc=0x${calc.toString(16)}, recv=0x${xorByte.toString(16)}`);
				}

				out.push({ kind: 'ds.x.bus', xHeader, data: Uint8Array.from(bodyNoXor) });
			} else {
				out.push({ kind: 'ds.unknown', header, payload });
			}
		} else if (header === Z21LanHeader.LAN_SYSTEMSTATE_DATACHANGED && payload.length === 16) {
			out.push({ kind: 'ds.system.state', state: Uint8Array.from(payload) });
		} else {
			out.push({ kind: 'ds.unknown', header, payload });
		}

		offset += len;
	}

	return out;
}

/**
 * Compute 8-bit XOR checksum over the given bytes.
 *
 * Typical use: Verify X-BUS payload integrity where the trailing XOR byte
 * should equal the XOR over all preceding payload bytes.
 *
 * @param data Byte array to checksum.
 * @returns 8-bit XOR of all bytes in `data` (0..255).
 */
function xor8(data: Uint8Array): number {
	let x = 0;
	for (const b of data) {
		x ^= b;
	}
	return x & 0xff;
}
