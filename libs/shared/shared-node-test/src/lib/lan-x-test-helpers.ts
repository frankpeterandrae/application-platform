/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Shared test helper functions for LAN-X encode tests.
 * Eliminates code duplication across multiple test files.
 * These helpers are now in @z21-suite/shared to be reusable across all test suites.
 */
import { expect } from 'vitest';
/**
 * Calculates XOR checksum for X-Bus payload (inline implementation to avoid circular dependency).
 * @param payload - The payload bytes to calculate XOR for
 * @returns The XOR checksum
 */
function xbusXor(payload: number[]): number {
	return payload.reduce((acc, byte) => acc ^ byte, 0);
}

/**
 * Verifies that the XOR checksum at the end of the buffer is valid.
 * @param buffer - The LAN-X frame buffer to verify
 */
export function expectValidXor(buffer: Buffer): void {
	const payload = Array.from(buffer.subarray(4, buffer.length - 1));
	const expectedXor = xbusXor(payload);
	expect(buffer[buffer.length - 1]).toBe(expectedXor);
}

/**
 * Extracts address bytes from a LAN-X frame.
 * @param buffer - The LAN-X frame buffer
 * @param offset - The byte offset where address bytes start (default: 6)
 * @returns Object with high and low address bytes
 */
export function extractAddressBytes(buffer: Buffer, offset = 6): { high: number; low: number } {
	return {
		high: buffer[offset],
		low: buffer[offset + 1]
	};
}

/**
 * Calculates expected address bytes according to DCC specification.
 * For addresses 1-99: high byte = 0, low byte = address
 * For addresses >= 100: high byte contains address bits with 0xc0 prefix, low byte contains remaining bits
 *
 * @param address - The locomotive or accessory address
 * @returns Object with expected high and low address bytes
 */
export function calculateExpectedAddressBytes(address: number): { high: number; low: number } {
	if (address < 100) {
		return { high: 0x00, low: address };
	}

	// 0xc0 is the long address prefix, 0x3f (MSB mask) extracts upper 6 bits
	const highByte = 0xc0 | ((address >> 8) & 0x3f);
	const lowByte = address & 0xff;
	return { high: highByte, low: lowByte };
}

/**
 * Verifies that address bytes in buffer match expected values for given address.
 * @param buffer - The LAN-X frame buffer
 * @param address - The expected address
 * @param offset - The byte offset where address bytes start (default: 6)
 */
export function expectAddressBytes(buffer: Buffer, address: number, offset = 6): void {
	const actual = extractAddressBytes(buffer, offset);
	const expected = calculateExpectedAddressBytes(address);

	expect(actual.high).toBe(expected.high);
	expect(actual.low).toBe(expected.low);
}
