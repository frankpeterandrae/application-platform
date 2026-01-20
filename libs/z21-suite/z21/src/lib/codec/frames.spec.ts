/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { FULL_BYTE_MASK } from '../constants';

import { encodeAccessoryAddress, encodeCvAddress, encodeLanX, xbusXor } from './frames';

describe('frames', () => {
	// Helper function to verify buffer structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.length).toBeGreaterThanOrEqual(6); // Minimum: len(2) + header(2) + xHeader(1) + xor(1)

		const len = buffer.readUInt16LE(0);
		expect(len).toBe(buffer.length);

		const header = buffer.readUInt16LE(2);
		expect(header).toBe(Z21LanHeader.LAN_X);
	}

	// Helper function to extract XOR byte from buffer
	function getXorByte(buffer: Buffer): number {
		return buffer[buffer.length - 1];
	}

	// Helper function to extract xBus payload (without XOR)
	function getXBusPayload(buffer: Buffer): number[] {
		return Array.from(buffer.subarray(4, buffer.length - 1));
	}

	// Helper function to calculate expected XOR for a command
	function calculateExpectedXor(commandKey: keyof typeof LAN_X_COMMANDS, additionalData: number[] = []): number {
		const command = LAN_X_COMMANDS[commandKey];
		const xHeader = command.xHeader;
		const fullXbus =
			'xBusCmd' in command && command.xBusCmd !== undefined
				? [xHeader, command.xBusCmd, ...additionalData]
				: [xHeader, ...additionalData];
		return xbusXor(fullXbus);
	}

	describe('xbusXor', () => {
		it('returns 0 for empty array', () => {
			const result = xbusXor([]);

			expect(result).toBe(0);
		});

		it('returns the single byte value when given one byte', () => {
			const result = xbusXor([0x42]);

			expect(result).toBe(0x42);
		});

		it('xors multiple bytes correctly and masks to 8 bits', () => {
			const bytes = [0x21, 0x80, FULL_BYTE_MASK];
			const expected = bytes.reduce((acc, b) => (acc ^ b) & FULL_BYTE_MASK, 0);

			const result = xbusXor(bytes);

			expect(result).toBe(expected);
		});

		it('handles Uint8Array input', () => {
			const bytes = Uint8Array.from([0x10, 0x20, 0x30]);
			const expected = (0x10 ^ 0x20 ^ 0x30) & FULL_BYTE_MASK;

			const result = xbusXor(bytes);

			expect(result).toBe(expected);
		});

		it('correctly masks values to 8 bits', () => {
			const bytes = [0xff, 0xff];
			// 0xFF ^ 0xFF = 0x00
			const result = xbusXor(bytes);

			expect(result).toBe(0x00);
		});

		it('is commutative (order independent for XOR)', () => {
			const bytes1 = [0x12, 0x34, 0x56];
			const bytes2 = [0x56, 0x12, 0x34];

			const result1 = xbusXor(bytes1);
			const result2 = xbusXor(bytes2);

			expect(result1).toBe(result2);
		});
	});

	describe('encodeLanX', () => {
		describe('frame structure validation', () => {
			it('encodes minimal xbus frame with header and checksum', () => {
				const result = encodeLanX('LAN_X_SET_STOP');

				expectValidLanXFrame(result);
				expect(result.length).toBe(6); // len(2) + header(2) + xHeader(1) + xor(1)
			});

			it('writes correct data length at start', () => {
				const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');

				const len = result.readUInt16LE(0);

				expect(len).toBe(result.length);
			});

			it('writes LAN_X header at bytes 2-3', () => {
				const result = encodeLanX('LAN_X_SET_TRACK_POWER_ON');

				const header = result.readUInt16LE(2);

				expect(header).toBe(Z21LanHeader.LAN_X);
			});
		});

		describe('xBus payload and checksum', () => {
			it('copies xbus payload and checksum correctly', () => {
				const result = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
				const command = LAN_X_COMMANDS.LAN_X_SET_TRACK_POWER_OFF;
				const expectedXor = calculateExpectedXor('LAN_X_SET_TRACK_POWER_OFF');

				expect(result[4]).toBe(command.xHeader);
				expect(result[5]).toBe(command.xBusCmd);
				expect(getXorByte(result)).toBe(expectedXor);
			});

			it('includes additional xbus data bytes in payload', () => {
				const additionalData = [0x01, 0x02, 0x03];
				const result = encodeLanX('LAN_X_SET_STOP', additionalData);

				const payload = getXBusPayload(result);

				expect(payload).toContain(0x01);
				expect(payload).toContain(0x02);
				expect(payload).toContain(0x03);
			});

			it('calculates XOR checksum over complete xbus payload including additional data', () => {
				const additionalData = [0xaa, 0xbb];
				const result = encodeLanX('LAN_X_SET_STOP', additionalData);

				const payload = getXBusPayload(result);
				const xorByte = getXorByte(result);
				const expectedXor = xbusXor(payload);

				expect(xorByte).toBe(expectedXor);
			});
		});

		describe('different command types', () => {
			it('produces different output for different payloads', () => {
				const result1 = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
				const result2 = encodeLanX('LAN_X_SET_TRACK_POWER_ON');

				expect(result1).not.toEqual(result2);
			});

			it('encodes command with xBusCmd correctly', () => {
				const result = encodeLanX('LAN_X_GET_VERSION');
				const command = LAN_X_COMMANDS.LAN_X_GET_VERSION;

				const payload = getXBusPayload(result);

				expect(payload[0]).toBe(command.xHeader);
				expect(payload[1]).toBe(command.xBusCmd);
			});

			it('encodes command without xBusCmd correctly', () => {
				const result = encodeLanX('LAN_X_GET_TURNOUT_INFO', [0x12, 0x34]);
				const command = LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO;

				const payload = getXBusPayload(result);

				expect(payload[0]).toBe(command.xHeader);
				expect(payload[1]).toBe(0x12); // First additional data byte
				expect(payload[2]).toBe(0x34); // Second additional data byte
			});
		});

		describe('edge cases', () => {
			it('handles empty additional data array', () => {
				const result = encodeLanX('LAN_X_SET_STOP', []);

				expectValidLanXFrame(result);
			});

			it('handles undefined additional data (defaults to empty)', () => {
				const result = encodeLanX('LAN_X_SET_STOP');

				expectValidLanXFrame(result);
			});

			it('handles large additional data arrays', () => {
				const largeData = Array.from({ length: 100 }, (_, i) => i % 256);
				const result = encodeLanX('LAN_X_SET_STOP', largeData);

				expectValidLanXFrame(result);
				expect(result.length).toBe(2 + 2 + 1 + largeData.length + 1);
			});

			it('correctly encodes bytes with value 0x00', () => {
				const data = [0x00, 0x00, 0x00];
				const result = encodeLanX('LAN_X_SET_STOP', data);

				const payload = getXBusPayload(result);

				expect(payload).toContain(0x00);
			});

			it('correctly encodes bytes with value 0xFF', () => {
				const data = [0xff, 0xff];
				const result = encodeLanX('LAN_X_SET_STOP', data);

				const payload = getXBusPayload(result);

				expect(payload).toContain(0xff);
			});
		});

		describe('checksum verification', () => {
			it('XOR byte allows frame verification', () => {
				const result = encodeLanX('LAN_X_GET_STATUS');

				const payload = getXBusPayload(result);
				const xorByte = getXorByte(result);
				const calculatedXor = xbusXor(payload);

				expect(xorByte).toBe(calculatedXor);
			});

			it('different payloads produce different XOR values', () => {
				const result1 = encodeLanX('LAN_X_SET_TRACK_POWER_OFF');
				const result2 = encodeLanX('LAN_X_SET_TRACK_POWER_ON');

				const xor1 = getXorByte(result1);
				const xor2 = getXorByte(result2);

				expect(xor1).not.toBe(xor2);
			});
		});
	});
	describe('encodeAccessoryAddress', () => {
		it('encodes address 0', () => {
			const result = encodeAccessoryAddress(0);
			expect(result.adrMsb).toBe(0);
			expect(result.adrLsb).toBe(0);
		});

		it('encodes address 255', () => {
			const result = encodeAccessoryAddress(255);
			expect(result.adrMsb).toBe(0);
			expect(result.adrLsb).toBe(255);
		});

		it('encodes address 16383 (maximum)', () => {
			const result = encodeAccessoryAddress(16383);
			expect(result.adrMsb).toBe(63);
			expect(result.adrLsb).toBe(255);
		});

		it('throws error for negative address', () => {
			expect(() => encodeAccessoryAddress(-1)).toThrow('out of range');
		});

		it('throws error for address above 16383', () => {
			expect(() => encodeAccessoryAddress(16384)).toThrow('out of range');
		});
	});

	describe('encodeCvAddress', () => {
		it('encodes CV address 1', () => {
			const result = encodeCvAddress(1);
			expect(result.adrMsb).toBe(0);
			expect(result.adrLsb).toBe(0);
		});

		it('encodes CV address 29', () => {
			const result = encodeCvAddress(29);
			expect(result.adrMsb).toBe(0);
			expect(result.adrLsb).toBe(28);
		});

		it('encodes CV address 1024', () => {
			const result = encodeCvAddress(1024);
			expect(result.adrMsb).toBe(3);
			expect(result.adrLsb).toBe(255);
		});

		it('encodes CV address 16383 (maximum)', () => {
			const result = encodeCvAddress(16383);
			expect(result.adrMsb).toBe(63);
			expect(result.adrLsb).toBe(254);
		});

		it('throws error for CV address 0', () => {
			expect(() => encodeCvAddress(0)).toThrow('out of range');
		});

		it('throws error for CV address above 16383', () => {
			expect(() => encodeCvAddress(16384)).toThrow('out of range');
		});
	});
});
