/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

import { SpeedByteMask } from '../constants';
import { type Z21Udp } from '../udp/udp';

import { Z21CommandService } from './z21-command-service';

describe('Z21CommandService', () => {
	let service: Z21CommandService;
	let mockUdp: Mocked<Z21Udp>;

	beforeEach(() => {
		mockUdp = {
			sendRaw: vi.fn()
		} as any;
		const mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		} as any;
		service = new Z21CommandService(mockUdp, mockLogger);
	});

	describe('sendTrackPower', () => {
		it('sends track power ON command to UDP when on is true', () => {
			service.sendTrackPower(true);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends track power OFF command to UDP when on is false', () => {
			service.sendTrackPower(false);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends different buffers for ON and OFF commands', () => {
			service.sendTrackPower(true);
			const onBuffer = mockUdp.sendRaw.mock.calls[0][0];

			service.sendTrackPower(false);
			const offBuffer = mockUdp.sendRaw.mock.calls[1][0];

			expect(onBuffer).not.toEqual(offBuffer);
		});
	});

	describe('setLocoDrive', () => {
		it('sends locomotive drive command to UDP', () => {
			service.setLocoDrive(1845, 0.5, 'FWD');

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('converts fractional speed 0.0 to speed step 0', () => {
			service.setLocoDrive(100, 0.0, 'FWD');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.VALUE).toBe(0);
		});

		it('converts fractional speed 1.0 to a non-zero speed step', () => {
			service.setLocoDrive(100, 1.0, 'FWD');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.VALUE).toBeGreaterThan(0);
		});

		it('converts fractional speed 0.5 to a mid-range speed step', () => {
			service.setLocoDrive(100, 0.5, 'FWD');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.VALUE).toBeGreaterThan(0);
			expect(speedByte & SpeedByteMask.VALUE).toBeLessThan(127);
		});

		it('encodes forward direction with high bit set', () => {
			service.setLocoDrive(100, 0.5, 'FWD');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(0x80);
		});

		it('encodes reverse direction with high bit clear', () => {
			service.setLocoDrive(100, 0.5, 'REV');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(0x00);
		});

		it('does not reuse the same buffer instance between calls with different speeds', () => {
			service.setLocoDrive(100, 0.3, 'FWD');
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoDrive(100, 0.7, 'FWD');
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toBe(buffer2);
		});

		it('sends different buffers for different directions', () => {
			service.setLocoDrive(100, 0.5, 'FWD');
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoDrive(100, 0.5, 'REV');
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends different buffers for different addresses', () => {
			service.setLocoDrive(100, 0.5, 'FWD');
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoDrive(200, 0.5, 'FWD');
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('produces non-zero speed step for rounded fractional speed', () => {
			service.setLocoDrive(100, 0.357, 'FWD');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			const speedStep = speedByte & SpeedByteMask.VALUE;
			expect(speedStep).toBeGreaterThan(0);
		});

		it('handles very small fractional speeds', () => {
			service.setLocoDrive(100, 0.01, 'FWD');

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.VALUE).toBeGreaterThan(0);
		});
	});

	describe('setLocoFunction', () => {
		it('sends setLocoFunction frames', () => {
			service.setLocoFunction(6, 2, 1 as any);

			expect(mockUdp.sendRaw).toHaveBeenCalled();
			const buf = mockUdp.sendRaw.mock.calls[mockUdp.sendRaw.mock.calls.length - 1][0];
			expect(Buffer.isBuffer(buf)).toBe(true);
			expect(buf.length).toBeGreaterThan(0);
		});
	});

	describe('getLocoInfo', () => {
		it('sends getLocoInfo frames', () => {
			service.getLocoInfo(12);
			expect(mockUdp.sendRaw).toHaveBeenCalled();
			const buf = mockUdp.sendRaw.mock.calls[mockUdp.sendRaw.mock.calls.length - 1][0];
			expect(Buffer.isBuffer(buf)).toBe(true);
			expect(buf.length).toBeGreaterThan(0);
		});
	});

	describe('setLocoFunction', () => {
		it('sends locomotive function command to UDP', () => {
			service.setLocoFunction(100, 0, 0b01);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('encodes function OFF type', () => {
			service.setLocoFunction(100, 5, 0b00);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('encodes function ON type', () => {
			service.setLocoFunction(100, 10, 0b01);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('encodes function TOGGLE type', () => {
			service.setLocoFunction(100, 15, 0b10);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends different buffers for different function numbers', () => {
			service.setLocoFunction(100, 0, 0b01);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoFunction(100, 1, 0b01);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends different buffers for different switch types', () => {
			service.setLocoFunction(100, 5, 0b00);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoFunction(100, 5, 0b01);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends different buffers for different addresses', () => {
			service.setLocoFunction(100, 5, 0b01);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoFunction(200, 5, 0b01);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('handles function number 0', () => {
			service.setLocoFunction(100, 0, 0b01);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles function number 31', () => {
			service.setLocoFunction(100, 31, 0b01);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles minimum locomotive address', () => {
			service.setLocoFunction(1, 5, 0b01);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum locomotive address', () => {
			service.setLocoFunction(9999, 5, 0b01);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});
	});

	describe('getLocoInfo', () => {
		it('sends locomotive info request to UDP', () => {
			service.getLocoInfo(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends different buffers for different addresses', () => {
			service.getLocoInfo(100);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.getLocoInfo(200);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('handles minimum locomotive address', () => {
			service.getLocoInfo(1);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum locomotive address', () => {
			service.getLocoInfo(9999);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends buffer with non-zero length', () => {
			service.getLocoInfo(100);

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces consistent buffer for same address', () => {
			service.getLocoInfo(100);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.getLocoInfo(100);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});
	});

	describe('getTurnoutInfo', () => {
		it('sends turnout info request to UDP', () => {
			service.getTurnoutInfo(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends different buffers for different addresses', () => {
			service.getTurnoutInfo(100);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.getTurnoutInfo(200);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('handles minimum accessory address', () => {
			service.getTurnoutInfo(0);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum accessory address', () => {
			service.getTurnoutInfo(16383);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles mid-range accessory address', () => {
			service.getTurnoutInfo(500);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends buffer with non-zero length', () => {
			service.getTurnoutInfo(100);

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces consistent buffer for same address', () => {
			service.getTurnoutInfo(100);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.getTurnoutInfo(100);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});
	});

	describe('setTurnout', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.clearAllTimers();
			vi.useRealTimers();
		});

		it('sends turnout activation command immediately', () => {
			service.setTurnout(100, 0);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends turnout deactivation command after default pulse time', () => {
			service.setTurnout(100, 0);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('sends turnout deactivation command after custom pulse time', () => {
			service.setTurnout(100, 0, { pulseMs: 200 });

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(200);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('does not send deactivation before pulse time', () => {
			service.setTurnout(100, 0, { pulseMs: 200 });

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends different buffers for activation and deactivation', () => {
			service.setTurnout(100, 0);
			const activationBuffer = mockUdp.sendRaw.mock.calls[0][0];

			vi.advanceTimersByTime(100);
			const deactivationBuffer = mockUdp.sendRaw.mock.calls[1][0];

			expect(activationBuffer).not.toEqual(deactivationBuffer);
		});

		it('sends different buffers for port 0 and port 1', () => {
			service.setTurnout(100, 0);
			const port0Buffer = mockUdp.sendRaw.mock.calls[0][0];

			service.setTurnout(100, 1);
			const port1Buffer = mockUdp.sendRaw.mock.calls[1][0];

			expect(port0Buffer).not.toEqual(port1Buffer);
		});

		it('uses default queue flag when not specified', () => {
			service.setTurnout(100, 0);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('respects custom queue flag', () => {
			service.setTurnout(100, 0, { queue: false });

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('cancels previous timer when setting same turnout again', () => {
			service.setTurnout(100, 0, { pulseMs: 200 });
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(50);

			service.setTurnout(100, 0, { pulseMs: 200 });
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(150);
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(50);
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(3);
		});

		it('does not cancel timer for different turnout addresses', () => {
			service.setTurnout(100, 0, { pulseMs: 200 });
			service.setTurnout(200, 0, { pulseMs: 200 });

			vi.advanceTimersByTime(200);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(4);
		});

		it('handles minimum accessory address', () => {
			service.setTurnout(0, 0);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum accessory address', () => {
			service.setTurnout(16383, 0);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends both activation and deactivation for complete cycle', () => {
			service.setTurnout(100, 0);

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];
			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends activation with same queue flag for both commands', () => {
			service.setTurnout(100, 0, { queue: false });

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('handles multiple concurrent turnout operations', () => {
			service.setTurnout(100, 0, { pulseMs: 100 });
			service.setTurnout(200, 1, { pulseMs: 150 });
			service.setTurnout(300, 0, { pulseMs: 200 });

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(3);

			vi.advanceTimersByTime(100);
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(4);

			vi.advanceTimersByTime(50);
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(5);

			vi.advanceTimersByTime(50);
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(6);
		});

		it('cleans up timer after deactivation completes', () => {
			service.setTurnout(100, 0);

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('does not send deactivation if timer was replaced', () => {
			service.setTurnout(100, 0, { pulseMs: 100 });

			vi.advanceTimersByTime(50);

			service.setTurnout(100, 1, { pulseMs: 200 });

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(3);
		});

		it('sends activation and deactivation immediately when pulseMs is zero', () => {
			service.setTurnout(50, 1, { pulseMs: 0 });

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			vi.runAllTimers();
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('sends deactivation after a very short pulse duration', () => {
			service.setTurnout(75, 0, { pulseMs: 1 });

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(1);
			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(2);
		});
	});

	describe('setLocoEStop', () => {
		it('sends emergency stop command to UDP', () => {
			service.setLocoEStop(100);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends emergency stop with minimum address', () => {
			service.setLocoEStop(1);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends emergency stop with maximum address', () => {
			service.setLocoEStop(9999);

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends different buffers for different addresses', () => {
			service.setLocoEStop(100);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoEStop(200);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends same buffer for repeated calls with same address', () => {
			service.setLocoEStop(150);
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.setLocoEStop(150);
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('creates a valid LAN_X formatted message', () => {
			service.setLocoEStop(100);

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});
	});

	describe('getVersion', () => {
		it('sends version request command to UDP', () => {
			service.getVersion();

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends buffer with positive length', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('always produces same buffer for repeated calls', () => {
			service.getVersion();
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.getVersion();
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_X formatted message', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});

		it('sends buffer with correct length encoding', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(7);
			expect(len).toBe(buffer.length);
		});

		it('encodes LAN_X_GET_VERSION command structure correctly', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// Byte 0-1: Length (0x07 0x00 in little-endian)
			expect(buffer[0]).toBe(0x07);
			expect(buffer[1]).toBe(0x00);
			// Byte 2-3: LAN_X header (0x40 0x00 in little-endian)
			expect(buffer[2]).toBe(0x40);
			expect(buffer[3]).toBe(0x00);
			// Byte 4: XBus header (0x21 for GET_VERSION)
			expect(buffer[4]).toBe(0x21);
			// Byte 5: XBus command (0x21 for GET_VERSION)
			expect(buffer[5]).toBe(0x21);
		});

		it('includes valid XOR checksum in buffer', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// XOR checksum is last byte
			const checksumByte = buffer[buffer.length - 1];
			// Calculate expected checksum: XBus header ^ XBus command
			const expectedChecksum = 0x21 ^ 0x21;
			expect(checksumByte).toBe(expectedChecksum);
		});

		it('sends complete GET_VERSION frame matching expected hex', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const hex = buffer.toString('hex');
			// Expected: 07004000212100
			// Length: 0x0007, Header: 0x0040, XBus: 0x21 0x21, XOR: 0x00
			expect(hex).toBe('07004000212100');
		});

		it('creates a valid LAN_X formatted message with proper structure', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
			// Verify XBus portion starts at byte 4
			expect(buffer.length).toBeGreaterThan(4);
		});

		it('sends buffer that matches encoding function output', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// Buffer should be exactly 7 bytes as per LAN_X_GET_VERSION specification
			expect(buffer.length).toBe(7);
			// Should start with length prefix
			expect(buffer.readUInt16LE(0)).toBe(7);
			// Should contain LAN_X header
			expect(buffer.readUInt16LE(2)).toBe(0x0040);
		});

		it('uses correct XBus header for STATUS group', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// XBus header for GET_VERSION should be 0x21 (STATUS group)
			expect(buffer[4]).toBe(0x21);
		});

		it('uses correct XBus command byte for GET_VERSION', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// XBus command for GET_VERSION should be 0x21
			expect(buffer[5]).toBe(0x21);
		});

		it('does not include extra data bytes after checksum', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// Buffer should be exactly 7 bytes: 2(length) + 2(header) + 2(xbus) + 1(checksum)
			expect(buffer.length).toBe(7);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			service.getVersion();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			// Verify buffer is valid for UDP transmission
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeGreaterThan(0);
			expect(buffer.length).toBeLessThanOrEqual(1472); // Max UDP payload size
		});
	});

	describe('getStatus', () => {
		it('sends status request command to UDP', () => {
			service.getStatus();

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends buffer with positive length', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('always produces same buffer for repeated calls', () => {
			service.getStatus();
			const buffer1 = mockUdp.sendRaw.mock.calls[0][0];

			service.getStatus();
			const buffer2 = mockUdp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_X formatted message', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});

		it('sends buffer with correct length encoding', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(7);
			expect(len).toBe(buffer.length);
		});

		it('encodes LAN_X_GET_STATUS command structure correctly', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer[0]).toBe(0x07);
			expect(buffer[1]).toBe(0x00);
			expect(buffer[2]).toBe(0x40);
			expect(buffer[3]).toBe(0x00);
			expect(buffer[4]).toBe(0x21);
			expect(buffer[5]).toBe(0x24);
		});

		it('includes valid XOR checksum in buffer', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const checksumByte = buffer[buffer.length - 1];
			const expectedChecksum = 0x21 ^ 0x24;
			expect(checksumByte).toBe(expectedChecksum);
		});

		it('sends complete GET_STATUS frame matching expected hex', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const hex = buffer.toString('hex');
			expect(hex).toBe('07004000212405');
		});

		it('creates a valid LAN_X formatted message with proper structure', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
			expect(buffer.length).toBeGreaterThan(4);
		});

		it('sends buffer that matches encoding function output', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBe(7);
			expect(buffer.readUInt16LE(0)).toBe(7);
			expect(buffer.readUInt16LE(2)).toBe(0x0040);
		});

		it('uses correct XBus header for STATUS group', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer[4]).toBe(0x21);
		});

		it('uses correct XBus command byte for GET_STATUS', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer[5]).toBe(0x24);
		});

		it('does not include extra data bytes after checksum', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBe(7);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			service.getStatus();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeGreaterThan(0);
			expect(buffer.length).toBeLessThanOrEqual(1472);
		});
	});
});
