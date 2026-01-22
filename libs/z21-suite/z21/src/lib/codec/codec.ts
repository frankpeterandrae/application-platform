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

		// Delegate per-header parsing to small helpers to keep this loop simple.
		switch (header) {
			case Z21LanHeader.LAN_X:
				handleXBus(payload, out);
				break;
			case Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED:
				handleSystemState(payload, out);
				break;
			case Z21LanHeader.LAN_GET_HWINFO:
				handleHwInfo(payload, out);
				break;
			case Z21LanHeader.LAN_GET_CODE:
				handleCode(payload, out);
				break;
			default:
				out.push({ kind: 'ds.unknown', header, payload, reason: 'unrecognized header or invalid payload length' });
		}

		offset += len;
	}

	return out;
}

// Helper: parse X-BUS payload (payload = [XHeader, DB..., XOR])
/**
 * Parse an X-BUS payload. Payload layout: [XHeader, DB..., XOR].
 * Pushes either a 'ds.x.bus' dataset or 'ds.unknown' / 'ds.bad_xor' entries into `out`.
 * @param payload - payload buffer
 * @param out - collector for decoded datasets
 */
function handleXBus(payload: Buffer, out: Z21Dataset[]): void {
	if (payload.length < 2) {
		out.push({ kind: 'ds.unknown', header: Z21LanHeader.LAN_X, payload, reason: 'x-bus too shortCircuit' });
		return;
	}

	const xHeader = payload[0];
	const bodyNoXor = payload.subarray(0, -1);
	const xorByte = payload.at(-1) as number;
	const db = bodyNoXor.subarray(1);

	const calc = xbusXor(bodyNoXor);
	if (calc !== xorByte) {
		out.push({ kind: 'ds.bad_xor', calc: calc.toString(16), recv: xorByte.toString(16) });
	}

	out.push({ kind: 'ds.x.bus', xHeader, data: Uint8Array.from(db) });
}

// Helper: parse system state payload (expects 16 bytes)
/**
 * Parse a system state payload (expects 16 bytes) and push a 'ds.system.state' dataset.
 * @param payload - payload buffer
 * @param out - collector for decoded datasets
 */
function handleSystemState(payload: Buffer, out: Z21Dataset[]): void {
	if (payload.length !== 16) {
		out.push({
			kind: 'ds.unknown',
			header: Z21LanHeader.LAN_SYSTEM_STATE_DATACHANGED,
			payload,
			reason: 'unrecognized header or invalid payload length'
		});
		return;
	}
	out.push({ kind: 'ds.system.state', state: Uint8Array.from(payload) });
}

// Helper: parse hwinfo payload (expects 8 bytes)
/**
 * Parse hwinfo payload (expects 8 bytes) and push a 'ds.hwinfo' dataset.
 * @param payload - payload buffer
 * @param out - collector for decoded datasets
 */
function handleHwInfo(payload: Buffer, out: Z21Dataset[]): void {
	if (payload.length !== 8) {
		out.push({
			kind: 'ds.unknown',
			header: Z21LanHeader.LAN_GET_HWINFO,
			payload,
			reason: 'unrecognized header or invalid payload length'
		});
		return;
	}
	const hwtype = payload.readUint32LE(0);
	const fwVersionBcd = payload.readUint32LE(4);
	out.push({ kind: 'ds.hwinfo', hwtype, fwVersionBcd });
}

// Helper: parse code payload (expects 1 byte)
/**
 * Parse code payload (expects 1 byte) and push a 'ds.code' dataset.
 * @param payload - payload buffer
 * @param out - collector for decoded datasets
 */
function handleCode(payload: Buffer, out: Z21Dataset[]): void {
	if (payload.length !== 1) {
		out.push({
			kind: 'ds.unknown',
			header: Z21LanHeader.LAN_GET_CODE,
			payload,
			reason: 'unrecognized header or invalid payload length'
		});
		return;
	}
	out.push({ kind: 'ds.code', code: payload[0] });
}
