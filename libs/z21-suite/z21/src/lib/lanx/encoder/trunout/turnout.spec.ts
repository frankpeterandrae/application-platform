/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expectValidXor } from '@application-platform/shared-node-test';
import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { AddessByteMask, FULL_BYTE_MASK } from '../../../constants';

import { encodeLanXGetTurnoutInfo, encodeLanXSetTurnout } from './turnout';

describe('turnout encoding', () => {
	// Helper function to verify frame structure (similar to helper functions in bootstrap.spec.ts)
	function expectValidLanXFrame(
		buffer: Buffer,
		command: typeof LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO | typeof LAN_X_COMMANDS.LAN_X_SET_TURNOUT
	): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.readUInt16LE(2)).toBe(Z21LanHeader.LAN_X);
		expect(buffer[4]).toBe(command.xHeader);
	}

	// Helper function to extract address bytes from frame
	function extractAddress(buffer: Buffer): { high: number; low: number } {
		return { high: buffer[5], low: buffer[6] };
	}

	// Helper function to calculate expected address bytes
	function calculateAddressBytes(address: number): { high: number; low: number } {
		const high = (address >> 8) & AddessByteMask.MSB;
		const low = address & FULL_BYTE_MASK;
		return { high, low };
	}

	// Helper function to extract control byte (DB2) from SET_TURNOUT frame
	function extractControlByte(buffer: Buffer): number {
		return buffer[7];
	}

	// Helper function to verify control byte flags
	function expectControlByteFlags(controlByte: number, port: number, activate: boolean, queue: boolean): void {
		expect(controlByte & 0x80).toBe(0x80); // Base bit always set
		expect(controlByte & 0x01).toBe(port & 0x01); // Port bit
		expect(controlByte & 0x08).toBe(activate ? 0x08 : 0x00); // Activate bit
		expect(controlByte & 0x20).toBe(queue ? 0x20 : 0x00); // Queue bit
	}

	describe('encodeLanXGetTurnoutInfo', () => {
		describe('frame structure', () => {
			it('returns a buffer', () => {
				const result = encodeLanXGetTurnoutInfo(100);

				expect(Buffer.isBuffer(result)).toBe(true);
			});

			it('includes correct LAN_X header and GET_TURNOUT_INFO command', () => {
				const result = encodeLanXGetTurnoutInfo(100);

				expectValidLanXFrame(result, LAN_X_COMMANDS.LAN_X_GET_TURNOUT_INFO);
			});

			it('includes valid xor checksum', () => {
				const result = encodeLanXGetTurnoutInfo(100);

				expectValidXor(result);
			});
		});

		describe('address encoding', () => {
			it('encodes minimum accessory address', () => {
				const result = encodeLanXGetTurnoutInfo(0);

				const addr = extractAddress(result);
				expect(addr).toEqual({ high: 0x00, low: 0x00 });
			});

			it('encodes maximum accessory address', () => {
				const result = encodeLanXGetTurnoutInfo(16383);

				const addr = extractAddress(result);
				const expected = calculateAddressBytes(16383);
				expect(addr).toEqual(expected);
			});

			it('encodes mid-range accessory address', () => {
				const result = encodeLanXGetTurnoutInfo(500);

				const addr = extractAddress(result);
				const expected = calculateAddressBytes(500);
				expect(addr).toEqual(expected);
			});

			it('handles boundary case with address 255', () => {
				const result = encodeLanXGetTurnoutInfo(255);

				const addr = extractAddress(result);
				expect(addr).toEqual({ high: 0x00, low: 0xff });
			});

			it('handles boundary case with address 256', () => {
				const result = encodeLanXGetTurnoutInfo(256);

				const addr = extractAddress(result);
				expect(addr).toEqual({ high: 0x01, low: 0x00 });
			});

			it('masks high byte to 6 bits', () => {
				const result = encodeLanXGetTurnoutInfo(16383);

				const addr = extractAddress(result);
				expect(addr.high).toBe(AddessByteMask.MSB);
			});
		});

		describe('consistency and variation', () => {
			it('produces consistent output for same address', () => {
				const result1 = encodeLanXGetTurnoutInfo(100);
				const result2 = encodeLanXGetTurnoutInfo(100);

				expect(result1).toEqual(result2);
			});

			it('produces different output for different addresses', () => {
				const result1 = encodeLanXGetTurnoutInfo(100);
				const result2 = encodeLanXGetTurnoutInfo(200);

				expect(result1).not.toEqual(result2);
			});
		});

		describe('validation and error handling', () => {
			it('throws error for address below 0', () => {
				expect(() => encodeLanXGetTurnoutInfo(-1)).toThrow('Accessory address');
			});

			it('throws error for address above 16383', () => {
				expect(() => encodeLanXGetTurnoutInfo(16384)).toThrow('Accessory address');
			});
		});
	});

	describe('encodeLanXSetTurnout', () => {
		describe('frame structure', () => {
			it('returns a buffer', () => {
				const result = encodeLanXSetTurnout(100, 0, true, false);

				expect(Buffer.isBuffer(result)).toBe(true);
			});

			it('includes correct LAN_X header and SET_TURNOUT command', () => {
				const result = encodeLanXSetTurnout(100, 0, true, false);

				expectValidLanXFrame(result, LAN_X_COMMANDS.LAN_X_SET_TURNOUT);
			});

			it('includes valid xor checksum', () => {
				const result = encodeLanXSetTurnout(100, 0, true, false);

				expectValidXor(result);
			});
		});

		describe('address encoding', () => {
			it('encodes minimum accessory address', () => {
				const result = encodeLanXSetTurnout(0, 0, true, false);

				const addr = extractAddress(result);
				expect(addr).toEqual({ high: 0x00, low: 0x00 });
			});

			it('encodes maximum accessory address', () => {
				const result = encodeLanXSetTurnout(16383, 0, true, false);

				const addr = extractAddress(result);
				const expected = calculateAddressBytes(16383);
				expect(addr).toEqual(expected);
			});

			it('handles boundary case with address 255', () => {
				const result = encodeLanXSetTurnout(255, 0, true, false);

				const addr = extractAddress(result);
				expect(addr).toEqual({ high: 0x00, low: 0xff });
			});

			it('handles boundary case with address 256', () => {
				const result = encodeLanXSetTurnout(256, 0, true, false);

				const addr = extractAddress(result);
				expect(addr).toEqual({ high: 0x01, low: 0x00 });
			});
		});

		describe('port and activation encoding', () => {
			it('encodes port 0 activated', () => {
				const result = encodeLanXSetTurnout(100, 0, true, false);

				const controlByte = extractControlByte(result);
				expectControlByteFlags(controlByte, 0, true, false);
			});

			it('encodes port 1 activated', () => {
				const result = encodeLanXSetTurnout(100, 1, true, false);

				const controlByte = extractControlByte(result);
				expectControlByteFlags(controlByte, 1, true, false);
			});

			it('encodes port 0 deactivated', () => {
				const result = encodeLanXSetTurnout(100, 0, false, false);

				const controlByte = extractControlByte(result);
				expectControlByteFlags(controlByte, 0, false, false);
			});

			it('encodes port 1 deactivated', () => {
				const result = encodeLanXSetTurnout(100, 1, false, false);

				const controlByte = extractControlByte(result);
				expectControlByteFlags(controlByte, 1, false, false);
			});
		});

		describe('queue encoding', () => {
			it('encodes queue enabled', () => {
				const result = encodeLanXSetTurnout(100, 0, true, true);

				const controlByte = extractControlByte(result);
				expect(controlByte & 0x20).toBe(0x20);
			});

			it('encodes queue disabled', () => {
				const result = encodeLanXSetTurnout(100, 0, true, false);

				const controlByte = extractControlByte(result);
				expect(controlByte & 0x20).toBe(0x00);
			});
		});

		describe('control byte structure', () => {
			it('sets base bit pattern with 0x80', () => {
				const result = encodeLanXSetTurnout(100, 0, true, false);

				const controlByte = extractControlByte(result);
				expect(controlByte & 0x80).toBe(0x80);
			});

			it('encodes all flags combined correctly', () => {
				const result = encodeLanXSetTurnout(100, 1, true, true);

				const controlByte = extractControlByte(result);
				expectControlByteFlags(controlByte, 1, true, true);
			});

			it('masks control byte to single byte', () => {
				const result = encodeLanXSetTurnout(100, 1, true, true);

				const controlByte = extractControlByte(result);
				expect(controlByte).toBeLessThanOrEqual(0xff);
			});
		});

		describe('consistency and variation', () => {
			it('produces consistent output for same parameters', () => {
				const result1 = encodeLanXSetTurnout(100, 0, true, false);
				const result2 = encodeLanXSetTurnout(100, 0, true, false);

				expect(result1).toEqual(result2);
			});

			it('produces different output for different ports', () => {
				const result1 = encodeLanXSetTurnout(100, 0, true, false);
				const result2 = encodeLanXSetTurnout(100, 1, true, false);

				expect(result1).not.toEqual(result2);
			});

			it('produces different output for different activation states', () => {
				const result1 = encodeLanXSetTurnout(100, 0, true, false);
				const result2 = encodeLanXSetTurnout(100, 0, false, false);

				expect(result1).not.toEqual(result2);
			});

			it('produces different output for different queue states', () => {
				const result1 = encodeLanXSetTurnout(100, 0, true, false);
				const result2 = encodeLanXSetTurnout(100, 0, true, true);

				expect(result1).not.toEqual(result2);
			});

			it('produces different output for different addresses', () => {
				const result1 = encodeLanXSetTurnout(100, 0, true, false);
				const result2 = encodeLanXSetTurnout(200, 0, true, false);

				expect(result1).not.toEqual(result2);
			});
		});

		describe('validation and error handling', () => {
			it('throws error for address below 0', () => {
				expect(() => encodeLanXSetTurnout(-1, 0, true, false)).toThrow('Accessory address');
			});

			it('throws error for address above 16383', () => {
				expect(() => encodeLanXSetTurnout(16384, 0, true, false)).toThrow('Accessory address');
			});
		});
	});
});
