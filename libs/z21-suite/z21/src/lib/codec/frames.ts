/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { LAN_X_COMMANDS, Z21LanHeader, type LanXCommandKey } from '@application-platform/z21-shared';

import { AddessByteMask, FULL_BYTE_MASK } from '../constants';

export type ByteLike = ReadonlyArray<number> | Uint8Array;

/**
 * Calculates the XOR checksum for X-BUS protocol messages.
 * Performs bitwise XOR over all provided bytes to generate a checksum value.
 * @param bytes - Array of bytes to checksum
 * @returns The XOR checksum value (0-255)
 */
export function xbusXor(bytes: ByteLike): number {
	let acc = 0;
	for (const b of bytes) {
		acc ^= b & FULL_BYTE_MASK;
	}

	return acc & FULL_BYTE_MASK;
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
 * @param xLanCommand - The LAN_X command key to encode
 * @param xbus - X-BUS protocol bytes (additional data after header and command)
 * @returns Buffer containing the complete LAN_X encoded message
 */
export function encodeLanX(xLanCommand: LanXCommandKey, xbus: readonly number[] = []): Buffer {
	const command = LAN_X_COMMANDS[xLanCommand];
	const xHeader = command.xHeader;

	// Build full X-BUS payload: header, optional cmd, and additional data
	const fullXbus = hasXbusCmd(command) ? [xHeader, command.xBusCmd, ...xbus] : [xHeader, ...xbus];

	const xor = xbusXor(fullXbus);
	const len = 2 + 2 + fullXbus.length + 1; // DataLen includes itself
	const buffer = Buffer.alloc(len);
	buffer.writeUInt16LE(len, 0);
	buffer.writeUInt16LE(Z21LanHeader.LAN_X, 2); // LAN_X header
	for (let i = 0; i < fullXbus.length; i++) {
		buffer[4 + i] = fullXbus[i];
	}
	buffer[4 + fullXbus.length] = xor;
	return buffer;
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
export function encodeLocoAddress(address: number): { adrMsb: number; adrLsb: number } {
	if (address < 1 || address > 9999) {
		throw new Error(`Address (${address}) out of range (1..9999)`);
	}

	const adrMsb = (address >> 8) & AddessByteMask.MSB;
	const adrLsb = address & FULL_BYTE_MASK;

	return address >= 128 ? { adrMsb: (0xc0 | adrMsb) & FULL_BYTE_MASK, adrLsb } : { adrMsb, adrLsb };
}

/**
 * Type guard to detect whether a LAN_X command entry includes an explicit xBusCmd.
 * Uses a runtime check that safely handles non-object inputs.
 */
function hasXbusCmd(command: unknown): command is { xBusCmd: number } {
	if (typeof command !== 'object' || command === null) return false;
	// Use hasOwnProperty to avoid issues with prototype keys
	const has = Object.hasOwn(command, 'xBusCmd');
	return has && typeof (command as { xBusCmd?: unknown }).xBusCmd === 'number';
}

/**
 * Encode an accessory (turnout) address into the two address bytes used by X-BUS.
 *
 * @param address - Accessory address (0..16383)
 * @throws Error if address is not in the allowed 0..16383 range.
 * @returns Object with `adrMsb` and `adrLsb` bytes (both 0..255).
 */
export function encodeAccessoryAddress(address: number): { adrMsb: number; adrLsb: number } {
	if (address < 0 || address > 16383) {
		throw new Error(`Accessory address (${address}) out of range (0..16383)`);
	}

	const adrMsb = (address >> 8) & FULL_BYTE_MASK;
	const adrLsb = address & FULL_BYTE_MASK;

	return { adrMsb, adrLsb };
}

/**
 * Encode an accessory (turnout) address into the two address bytes used by X-BUS.
 *
 * @param address - Accessory address (0..16383)
 * @throws Error if address is not in the allowed 0..16383 range.
 * @returns Object with `adrMsb` and `adrLsb` bytes (both 0..255).
 */
export function encodeCvAddress(address: number): { adrMsb: number; adrLsb: number } {
	if (address < 1 || address > 16383) {
		throw new Error(`Accessory address (${address}) out of range (0..16383)`);
	}
	const correctedAddress = address - 1; // CV addresses are 1-based, adjust to 0-based
	const adrMsb = (correctedAddress >> 8) & FULL_BYTE_MASK;
	const adrLsb = correctedAddress & FULL_BYTE_MASK;

	return { adrMsb, adrLsb };
}
