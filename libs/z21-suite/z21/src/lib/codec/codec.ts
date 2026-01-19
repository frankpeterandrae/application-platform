/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Z21LanHeader } from '@application-platform/z21-shared';

import type { Z21Dataset } from './codec-types';
import { xbusXor } from './frames';

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
				const bodyNoXor = payload.subarray(0, payload.length - 1);
				const xorByte = payload[payload.length - 1];
				const db = bodyNoXor.subarray(1);

				const calc = xbusXor(bodyNoXor);
				// XOR check: if false, deliver anyway (you want to see UDP drops/bugs)
				if (calc !== xorByte) {
					out.push({ kind: 'ds.bad_xor', calc: calc.toString(16), recv: xorByte.toString(16) });
				}

				// Ensure we return a plain Uint8Array for test equality
				out.push({ kind: 'ds.x.bus', xHeader, data: Uint8Array.from(db) });
			} else {
				out.push({ kind: 'ds.unknown', header, payload, reason: 'x-bus too short' });
			}
		} else if (header === Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED && payload.length === 16) {
			out.push({ kind: 'ds.system.state', state: Uint8Array.from(payload) });
		} else if (header === Z21LanHeader.LAN_GET_HWINFO && payload.length === 8) {
			const hwtype = payload.readUint32LE(0);
			const fwVersionBcd = payload.readUint32LE(4);
			out.push({ kind: 'ds.hwinfo', hwtype, fwVersionBcd });
		} else if (header === Z21LanHeader.LAN_GET_CODE && payload.length === 1) {
			const code = payload[0];
			out.push({ kind: 'ds.code', code });
		} else {
			out.push({ kind: 'ds.unknown', header, payload, reason: 'unrecognized header or invalid payload length' });
		}

		offset += len;
	}

	return out;
}
