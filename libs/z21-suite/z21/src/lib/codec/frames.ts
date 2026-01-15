/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Direction } from '@application-platform/domain';

import { TrackPowerValue, XBusHeader, Z21LanHeader } from '../constants';

/**
 * Calculates the XOR checksum for X-BUS protocol messages.
 * Performs bitwise XOR over all provided bytes to generate a checksum value.
 * @param bytes - Array of bytes to checksum
 * @returns The XOR checksum value (0-255)
 */
export function xbusXor(bytes: readonly number[]): number {
	return bytes.reduce((acc, b) => acc ^ (b & 0xff), 0) & 0xff;
}

/**
 * Encodes a message in LAN_X format for Z21 communication.
 * Wraps X-BUS protocol data with LAN headers, length field, and XOR checksum.
 *
 * Message structure:
 * - Bytes 0-1: DataLen (little-endian, includes the length field itself)
 * - Bytes 2-3: Header (0x0040 for LAN_X)
 * - Bytes 4..n: X-BUS payload
 * - Byte n+1: XOR checksum
 *
 * @param xbus - X-BUS protocol bytes (header + data)
 * @returns Buffer containing the complete LAN_X encoded message
 */
export function encodeLanX(xbus: readonly number[]): Buffer {
	const xor = xbusXor(xbus);
	const len = 2 + 2 + xbus.length + 1; // DataLen includes itself
	const buffer = Buffer.alloc(len);
	buffer.writeUInt16LE(len, 0);
	buffer.writeUInt16LE(Z21LanHeader.LAN_X, 2); // LAN_X header
	for (let i = 0; i < xbus.length; i++) {
		buffer[4 + i] = xbus[i];
	}
	buffer[4 + xbus.length] = xor;
	return buffer;
}

/**
 * Encodes a command to turn track power OFF.
 * Generates a LAN_X message with TrackPower header and Off value.
 * @returns Buffer containing the track power OFF command (7 bytes: 07 00 40 00 21 80 A1)
 */
export function encodeLanXSetTrackPowerOff(): Buffer {
	return encodeLanX([XBusHeader.TrackPower, TrackPowerValue.Off]); // XOR becomes 0xA1
}

/**
 * Encodes a command to turn track power ON.
 * Generates a LAN_X message with TrackPower header and On value.
 * @returns Buffer containing the track power ON command (7 bytes: 07 00 40 00 21 81 A0)
 */
export function encodeLanXSetTrackPowerOn(): Buffer {
	return encodeLanX([XBusHeader.TrackPower, TrackPowerValue.On]); // XOR becomes 0xA0
}

/**
 * Encodes speed value for 128-step DCC speed control.
 * Maps speed steps (0-126) to protocol values (0-127), with special handling for emergency stop.
 * @param step - Speed step (0 = stop, 1-126 = speed levels, >126 = max speed)
 * @param estop - Whether to indicate emergency stop (true = estop, false = normal)
 * @returns Encoded speed value (0-127)
 */
function encodeSpeed128(step: number, estop = false): number {
	if (estop) return 1;
	if (step <= 0) return 0;
	if (step > 126) step = 126;
	return step + 1; // Step 1 -> 2, Step 126 -> 127
}

/**
 * Encodes direction and speed into a single byte.
 * The highest bit indicates direction (1 = forward, 0 = reverse).
 * The lower 7 bits represent the speed code (0-127).
 * @param forward - Direction ('FWD' for forward, 'REV' for reverse)
 * @param speedCode0to127 - Speed code (0-127)
 * @returns Encoded direction/speed byte
 */
function encodeDirSpeedByte(forward: Direction, speedCode0to127: number): number {
	const directionBit = forward === 'FWD' ? 0x80 : 0x00;
	return directionBit | (speedCode0to127 & 0x7f);
}

/**
 * Encodes a locomotive drive command with 128 speed steps.
 * Constructs a LAN_X message with LocoDrive header, address, and direction/speed byte.
 * @param address - Locomotive address (1-9999)
 * @param step0to126 - Speed step (0 = stop, 1-126 = speed levels, >126 = max speed)
 * @param forward - Direction ('FWD' for forward, 'REV' for reverse)
 * @returns Buffer containing the locomotive drive command
 */
export function encodeLocoDrive128(address: number, step0to126: number, forward: Direction): Buffer {
	if (address < 1 || address > 9999) {
		throw new Error(`Address (${address}) out of range (1..9999)`);
	}
	if (step0to126 < 0 || step0to126 > 128) {
		throw new Error('Speed out of range (0..128)');
	}

	const addHigh = (address >> 8) & 0x3f;
	const addLow = address & 0xff;

	const speedCode = encodeSpeed128(step0to126);
	const rv = encodeDirSpeedByte(forward, speedCode);

	return encodeLanX([
		XBusHeader.LocoDrive,
		0x13, // 128 speed steps
		addHigh,
		addLow,
		rv
	]);
}
