/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Direction } from '@application-platform/z21-shared';

import {
	AddessByteMask,
	FULL_BYTE_MASK,
	SpeedByteMask,
	TrackPowerValue,
	XBusHeader,
	XBusLocoCmd,
	Z21LanHeader,
	type LocoFunctionSwitchType
} from '../constants';

/**
 * Calculates the XOR checksum for X-BUS protocol messages.
 * Performs bitwise XOR over all provided bytes to generate a checksum value.
 * @param bytes - Array of bytes to checksum
 * @returns The XOR checksum value (0-255)
 */
export function xbusXor(bytes: readonly number[]): number {
	return bytes.reduce((acc, b) => acc ^ (b & FULL_BYTE_MASK), 0) & FULL_BYTE_MASK;
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
 * Encode a 128-step speed value into the internal code used by the X‑BUS drive command.
 *
 * Encoding rules:
 * - If estop === true, return 1 (special emergency-stop code).
 * - If step <= 0, return 0 (stopped).
 * - If step > 126, clamp to 126 (maximum usable step before masking).
 * - Otherwise return step + 1 (because X-BUS maps real steps shifted by +1).
 *
 * Returned value is in the range 0..127 (fits into the 7-bit speed field).
 *
 * @param step - Speed step in the expected 0..126 range (128 treated specially in external checks).
 * @param estop - If true, encode emergency-stop special value.
 * @returns Encoded speed code (0..127).
 */
function encodeSpeed128(step: number, estop = false): number {
	if (estop) return 1;
	if (step <= 0) return 0;
	if (step > 126) step = 126;
	return step + 1; // Step 1 -> 2, Step 126 -> 127
}

/**
 * Compose the direction+speed byte for 128-step X-BUS loco drive commands.
 *
 * This byte encodes a direction bit in the MSB and the 7-bit speed value in the low bits.
 *
 * @param forward - Direction string ('FWD' for forward, otherwise treated as reverse).
 * @param speedCode0to127 - Encoded speed code returned from encodeSpeed128 (0..127).
 * @returns Single byte with direction bit and speed bits ORed together.
 */
function encodeDirSpeedByte(forward: Direction, speedCode0to127: number): number {
	const directionBit = forward === 'FWD' ? SpeedByteMask.DIRECTION_FORWARD : SpeedByteMask.DIRECTION_REWARD;
	return directionBit | (speedCode0to127 & SpeedByteMask.VALUE);
}

/**
 * Encode a 128-step locomotive drive LAN_X frame.
 *
 * This function performs input validation on `step0to126`, converts the user-visible
 * step into the X-BUS code, composes the direction/speed byte and the loco address bytes,
 * and wraps everything into a LAN_X frame using `encodeLanX`.
 *
 * @param address - Locomotive address (DCC address). Valid range: 1..9999.
 * @param step0to126 - Speed expressed in discrete steps (0 = stop, up to 126). Values outside will throw.
 * @param forward - Direction ('FWD' or e.g. 'REV') used to set the direction bit.
 * @throws Error if `step0to126` is outside allowed range (less than 0 or greater than 128).
 * @returns Buffer with a complete LAN_X loco drive frame.
 */
export function encodeLocoDrive128(address: number, step0to126: number, forward: Direction): Buffer {
	if (step0to126 < 0 || step0to126 > 128) {
		throw new Error('Speed out of range (0..128)');
	}
	const speedCode = encodeSpeed128(step0to126);
	const rv = encodeDirSpeedByte(forward, speedCode);

	const { adrMsb, adrLsb } = endcodeLocoAddress(address);
	return encodeLanX([XBusHeader.LocoDrive, XBusLocoCmd.SetLocoDrive_128, adrMsb, adrLsb, rv]);
}

/**
 * Encode a Set Loco Function (F0..Fn) X-BUS command wrapped in LAN_X.
 *
 * The function encodes the argument `type` (two bits) into the top bits and the function number
 * (0..31) into the lower bits of the command's data byte. The resulting X-BUS payload is then
 * passed to `encodeLanX`.
 *
 * @param address - Locomotive address to target (1..9999).
 * @param functionNumber - Function index to modify (0..31). Throws if out of range.
 * @param type - One of the LocoFunctionSwitchType flags (Off, On, Toggle).
 * @throws Error if `functionNumber` is not in the 0..31 range.
 * @returns Buffer containing the LAN_X SetLocoFunction message.
 */
export function encodeLanXSetLocoFunction(address: number, functionNumber: number, type: LocoFunctionSwitchType): Buffer {
	if (functionNumber < 0 || functionNumber > 31) {
		throw new Error('Function number out of range (0..31)');
	}

	const { adrMsb, adrLsb } = endcodeLocoAddress(address);

	const ttNn = ((type & 0b11) << 6) | (functionNumber & 0x3f);

	return encodeLanX([XBusHeader.LocoDrive, XBusLocoCmd.SetLocoFunction, adrMsb, adrLsb, ttNn]);
}

/**
 * Encode a locomotive address into the two address bytes used by X-BUS.
 *
 * Address encoding rules:
 * - Valid addresses: 1..9999 (throws otherwise)
 * - adrMsb: top bits are the high address bits masked and, for large addresses (>=128),
 *   the 0xc0 prefix is applied to indicate a long address, then masked to a single byte.
 * - adrLsb: low 8 bits of the address.
 *
 * This routine keeps masking operations explicit to ensure only the intended bits are set.
 *
 * @param address - Numeric loco address (1..9999)
 * @throws Error if address is not in the allowed 1..9999 range.
 * @returns Object with `adrMsb` and `adrLsb` bytes (both 0..255).
 */
function endcodeLocoAddress(address: number): { adrMsb: number; adrLsb: number } {
	if (address < 1 || address > 9999) {
		throw new Error(`Address (${address}) out of range (1..9999)`);
	}

	const adrMsb = (address >> 8) & AddessByteMask.MSB;
	const adrLsb = address & FULL_BYTE_MASK;

	return address >= 128 ? { adrMsb: (0xc0 | adrMsb) & FULL_BYTE_MASK, adrLsb } : { adrMsb, adrLsb };
}

/**
 * Encode a LAN_X GetLocoInfo command for a given address.
 *
 * Note: The function name currently contains a typo (`encdode...`) — the function is exported
 * under that name to avoid breaking existing callers. The behaviour is correct: it composes the
 * GetLocoInfo X-BUS header and the loco address bytes and then wraps them in a LAN_X frame.
 *
 * @param address - Locomotive numeric address to query (1..9999)
 * @returns Buffer containing the GetLocoInfo LAN_X command.
 */
export function encdodeLanXGetLocoInfo(address: number): Buffer {
	const { adrMsb, adrLsb } = endcodeLocoAddress(address);

	return encodeLanX([
		XBusHeader.GetLocoInfo,
		XBusLocoCmd.GetLocoInfo, //0xe3,
		adrMsb,
		adrLsb
	]);
}
