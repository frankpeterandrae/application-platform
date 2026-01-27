/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DeepMock, resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SpeedByteMask } from '../constants';
import { type Z21Udp } from '../udp/udp';

import { Z21CommandService } from './z21-command-service';

// Use vi.fn() type for mock functions instead of namespace types
type MockFn = ReturnType<typeof vi.fn>;

type Logger = {
	debug: MockFn;
	info: MockFn;
	warn: MockFn;
	error: MockFn;
};

type Services = {
	udp: any; // mocked Z21Udp
	logger: any; // mocked Logger
	service: Z21CommandService;
};

describe('Z21CommandService', () => {
	// Helper function to create mocked services (similar to makeProviders in bootstrap.spec.ts)
	function makeServices(): Services {
		const udp = DeepMock<Z21Udp>() as any;
		const logger = DeepMock<Logger>() as any;
		const service = new Z21CommandService(udp, logger);

		return { udp, logger, service };
	}

	let services: Services;

	beforeEach(() => {
		services = makeServices();
		resetMocksBeforeEach(services);
	});

	// Helper function to extract buffer from UDP call
	function extractBuffer(callIndex = 0): Buffer {
		return services.udp.sendRaw.mock.calls[callIndex][0];
	}

	// Helper function to verify UDP was called
	function expectUdpCalled(times = 1): void {
		expect(services.udp.sendRaw).toHaveBeenCalledTimes(times);
	}

	// Helper function to verify buffer is valid
	function expectValidBuffer(buffer: Buffer): void {
		expect(Buffer.isBuffer(buffer)).toBe(true);
		expect(buffer.length).toBeGreaterThan(0);
	}

	// Helper function to extract speed byte from buffer
	function extractSpeedByte(buffer: Buffer): number {
		return buffer[8];
	}

	// Helper function to verify speed byte properties
	// NOTE: These helpers are used in sendTrackPower and setLocoDrive tests.
	// Other tests can be refactored incrementally to use these helpers for better DRY.
	function expectSpeedByte(
		buffer: Buffer,
		checks: {
			value?: { greaterThan?: number; lessThan?: number; equals?: number };
			direction?: 'FWD' | 'REV';
		}
	): void {
		const speedByte = extractSpeedByte(buffer);

		if (checks.value?.greaterThan !== undefined) {
			expect(speedByte & SpeedByteMask.VALUE).toBeGreaterThan(checks.value.greaterThan);
		}
		if (checks.value?.lessThan !== undefined) {
			expect(speedByte & SpeedByteMask.VALUE).toBeLessThan(checks.value.lessThan);
		}
		if (checks.value?.equals !== undefined) {
			expect(speedByte & SpeedByteMask.VALUE).toBe(checks.value.equals);
		}
		if (checks.direction === 'FWD') {
			expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(0x80);
		}
		if (checks.direction === 'REV') {
			expect(speedByte & SpeedByteMask.DIRECTION_FORWARD).toBe(0x00);
		}
	}

	describe('sendTrackPower', () => {
		it('sends track power ON command to UDP when on is true', () => {
			services.service.sendTrackPower(true);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
		});

		it('sends track power OFF command to UDP when on is false', () => {
			services.service.sendTrackPower(false);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
		});

		it('sends different buffers for ON and OFF commands', () => {
			services.service.sendTrackPower(true);
			const onBuffer = extractBuffer(0);

			services.service.sendTrackPower(false);
			const offBuffer = extractBuffer(1);

			expect(onBuffer).not.toEqual(offBuffer);
		});
	});

	describe('setLocoDrive', () => {
		it('sends locomotive drive command to UDP', () => {
			services.service.setLocoDrive(1845, 0.5, 'FWD');

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
		});

		it('converts fractional speed 0.0 to speed step 0', () => {
			services.service.setLocoDrive(100, 0.0, 'FWD');

			const buffer = extractBuffer(0);
			expectSpeedByte(buffer, { value: { equals: 0 } });
		});

		it('converts fractional speed 1.0 to a non-zero speed step', () => {
			services.service.setLocoDrive(100, 1.0, 'FWD');

			const buffer = extractBuffer(0);
			expectSpeedByte(buffer, { value: { greaterThan: 0 } });
		});

		it('converts fractional speed 0.5 to a mid-range speed step', () => {
			services.service.setLocoDrive(100, 0.5, 'FWD');

			const buffer = extractBuffer(0);
			expectSpeedByte(buffer, {
				value: { greaterThan: 0, lessThan: 127 }
			});
		});

		it('encodes forward direction with high bit set', () => {
			services.service.setLocoDrive(100, 0.5, 'FWD');

			const buffer = extractBuffer(0);
			expectSpeedByte(buffer, { direction: 'FWD' });
		});

		it('encodes reverse direction with high bit clear', () => {
			services.service.setLocoDrive(100, 0.5, 'REV');

			const buffer = extractBuffer(0);
			expectSpeedByte(buffer, { direction: 'REV' });
		});

		it('does not reuse the same buffer instance between calls with different speeds', () => {
			services.service.setLocoDrive(100, 0.3, 'FWD');
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoDrive(100, 0.7, 'FWD');
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toBe(buffer2);
		});

		it('sends different buffers for different directions', () => {
			services.service.setLocoDrive(100, 0.5, 'FWD');
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoDrive(100, 0.5, 'REV');
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends different buffers for different addresses', () => {
			services.service.setLocoDrive(100, 0.5, 'FWD');
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoDrive(200, 0.5, 'FWD');
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('produces non-zero speed step for rounded fractional speed', () => {
			services.service.setLocoDrive(100, 0.357, 'FWD');

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			const speedStep = speedByte & SpeedByteMask.VALUE;
			expect(speedStep).toBeGreaterThan(0);
		});

		it('handles very small fractional speeds', () => {
			services.service.setLocoDrive(100, 0.01, 'FWD');

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const speedByte = buffer[8];
			expect(speedByte & SpeedByteMask.VALUE).toBeGreaterThan(0);
		});
	});

	describe('setLocoFunction', () => {
		it('sends locomotive function command to UDP', () => {
			services.service.setLocoFunction(100, 0, 0b01);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('encodes function OFF type', () => {
			services.service.setLocoFunction(100, 5, 0b00);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('encodes function ON type', () => {
			services.service.setLocoFunction(100, 10, 0b01);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('encodes function TOGGLE type', () => {
			services.service.setLocoFunction(100, 15, 0b10);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends different buffers for different function numbers', () => {
			services.service.setLocoFunction(100, 0, 0b01);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoFunction(100, 1, 0b01);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends different buffers for different switch types', () => {
			services.service.setLocoFunction(100, 5, 0b00);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoFunction(100, 5, 0b01);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends different buffers for different addresses', () => {
			services.service.setLocoFunction(100, 5, 0b01);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoFunction(200, 5, 0b01);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('handles function number 0', () => {
			services.service.setLocoFunction(100, 0, 0b01);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles function number 31', () => {
			services.service.setLocoFunction(100, 31, 0b01);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles minimum locomotive address', () => {
			services.service.setLocoFunction(1, 5, 0b01);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum locomotive address', () => {
			services.service.setLocoFunction(9999, 5, 0b01);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});
	});

	describe('getLocoInfo', () => {
		it('sends locomotive info request to UDP', () => {
			services.service.getLocoInfo(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends different buffers for different addresses', () => {
			services.service.getLocoInfo(100);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getLocoInfo(200);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('handles minimum locomotive address', () => {
			services.service.getLocoInfo(1);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum locomotive address', () => {
			services.service.getLocoInfo(9999);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends buffer with non-zero length', () => {
			services.service.getLocoInfo(100);

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces consistent buffer for same address', () => {
			services.service.getLocoInfo(100);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getLocoInfo(100);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});
	});

	describe('getTurnoutInfo', () => {
		it('sends turnout info request to UDP', () => {
			services.service.getTurnoutInfo(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends different buffers for different addresses', () => {
			services.service.getTurnoutInfo(100);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getTurnoutInfo(200);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('handles minimum accessory address', () => {
			services.service.getTurnoutInfo(0);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum accessory address', () => {
			services.service.getTurnoutInfo(16383);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles mid-range accessory address', () => {
			services.service.getTurnoutInfo(500);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends buffer with non-zero length', () => {
			services.service.getTurnoutInfo(100);

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces consistent buffer for same address', () => {
			services.service.getTurnoutInfo(100);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getTurnoutInfo(100);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

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
			services.service.setTurnout(100, 0);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends turnout deactivation command after default pulse time', () => {
			services.service.setTurnout(100, 0);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('sends turnout deactivation command after custom pulse time', () => {
			services.service.setTurnout(100, 0, { pulseMs: 200 });

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(200);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('does not send deactivation before pulse time', () => {
			services.service.setTurnout(100, 0, { pulseMs: 200 });

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends different buffers for activation and deactivation', () => {
			services.service.setTurnout(100, 0);
			const activationBuffer = services.udp.sendRaw.mock.calls[0][0];

			vi.advanceTimersByTime(100);
			const deactivationBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(activationBuffer).not.toEqual(deactivationBuffer);
		});

		it('sends different buffers for port 0 and port 1', () => {
			services.service.setTurnout(100, 0);
			const port0Buffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.setTurnout(100, 1);
			const port1Buffer = services.udp.sendRaw.mock.calls[1][0];

			expect(port0Buffer).not.toEqual(port1Buffer);
		});

		it('uses default queue flag when not specified', () => {
			services.service.setTurnout(100, 0);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('respects custom queue flag', () => {
			services.service.setTurnout(100, 0, { queue: false });

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('cancels previous timer when setting same turnout again', () => {
			services.service.setTurnout(100, 0, { pulseMs: 200 });
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(50);

			services.service.setTurnout(100, 0, { pulseMs: 200 });
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(150);
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(50);
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);
		});

		it('does not cancel timer for different turnout addresses', () => {
			services.service.setTurnout(100, 0, { pulseMs: 200 });
			services.service.setTurnout(200, 0, { pulseMs: 200 });

			vi.advanceTimersByTime(200);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(4);
		});

		it('handles minimum accessory address', () => {
			services.service.setTurnout(0, 0);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('handles maximum accessory address', () => {
			services.service.setTurnout(16383, 0);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
		});

		it('sends both activation and deactivation for complete cycle', () => {
			services.service.setTurnout(100, 0);

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];
			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends activation with same queue flag for both commands', () => {
			services.service.setTurnout(100, 0, { queue: false });

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('handles multiple concurrent turnout operations', () => {
			services.service.setTurnout(100, 0, { pulseMs: 100 });
			services.service.setTurnout(200, 1, { pulseMs: 150 });
			services.service.setTurnout(300, 0, { pulseMs: 200 });

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);

			vi.advanceTimersByTime(100);
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(4);

			vi.advanceTimersByTime(50);
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(5);

			vi.advanceTimersByTime(50);
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(6);
		});

		it('cleans up timer after deactivation completes', () => {
			services.service.setTurnout(100, 0);

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('does not send deactivation if timer was replaced', () => {
			services.service.setTurnout(100, 0, { pulseMs: 100 });

			vi.advanceTimersByTime(50);

			services.service.setTurnout(100, 1, { pulseMs: 200 });

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);
		});

		it('sends activation and deactivation immediately when pulseMs is zero', () => {
			services.service.setTurnout(50, 1, { pulseMs: 0 });

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			vi.runAllTimers();
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
		});

		it('sends deactivation after a very shortCircuit pulse duration', () => {
			services.service.setTurnout(75, 0, { pulseMs: 1 });

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(1);
			expect(services.udp.sendRaw).toHaveBeenCalledTimes(2);
		});
	});

	describe('setLocoEStop', () => {
		it('sends emergency stop command to UDP', () => {
			services.service.setLocoEStop(100);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('sends emergency stop with minimum address', () => {
			services.service.setLocoEStop(1);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends emergency stop with maximum address', () => {
			services.service.setLocoEStop(9999);

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('sends different buffers for different addresses', () => {
			services.service.setLocoEStop(100);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoEStop(200);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).not.toEqual(buffer2);
		});

		it('sends same buffer for repeated calls with same address', () => {
			services.service.setLocoEStop(150);
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setLocoEStop(150);
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('creates a valid LAN_X formatted message', () => {
			services.service.setLocoEStop(100);

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});
	});

	describe('getXBusVersion()', () => {
		it('sends version request command to UDP', () => {
			services.service.getXBusVersion();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.getXBusVersion();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getXBusVersion();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_X formatted message with correct structure', () => {
			services.service.getXBusVersion();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(7);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});

		it('encodes LAN_X_GET_VERSION command structure correctly', () => {
			services.service.getXBusVersion();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer[0]).toBe(0x07);
			expect(buffer[1]).toBe(0x00);
			expect(buffer[2]).toBe(0x40);
			expect(buffer[3]).toBe(0x00);
			expect(buffer[4]).toBe(0x21);
			expect(buffer[5]).toBe(0x21);
		});

		it('sends complete GET_VERSION frame matching expected hex', () => {
			services.service.getXBusVersion();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const hex = buffer.toString('hex');
			expect(hex).toBe('07004000212100');
		});
	});

	describe('getStatus', () => {
		it('sends status request command to UDP', () => {
			services.service.getStatus();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.getStatus();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getStatus();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_X formatted message with correct structure', () => {
			services.service.getStatus();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(7);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});

		it('encodes LAN_X_GET_STATUS command structure correctly', () => {
			services.service.getStatus();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer[0]).toBe(0x07);
			expect(buffer[1]).toBe(0x00);
			expect(buffer[2]).toBe(0x40);
			expect(buffer[3]).toBe(0x00);
			expect(buffer[4]).toBe(0x21);
			expect(buffer[5]).toBe(0x24);
		});

		it('sends complete GET_STATUS frame matching expected hex', () => {
			services.service.getStatus();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const hex = buffer.toString('hex');
			expect(hex).toBe('07004000212405');
		});
	});

	describe('setStop', () => {
		it('sends global emergency stop command to UDP', () => {
			services.service.setStop();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.setStop();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.setStop();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_X formatted message with correct structure', () => {
			services.service.setStop();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(6);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});

		it('encodes LAN_X_SET_STOP command structure correctly', () => {
			services.service.setStop();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer[0]).toBe(0x06);
			expect(buffer[1]).toBe(0x00);
			expect(buffer[2]).toBe(0x40);
			expect(buffer[3]).toBe(0x00);
			expect(buffer[4]).toBe(0x80);
			expect(buffer[5]).toBe(0x80);
		});

		it('sends complete SET_STOP frame matching expected hex', () => {
			services.service.setStop();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const hex = buffer.toString('hex');
			expect(hex).toBe('060040008080');
		});

		it('sends buffer with non-zero length', () => {
			services.service.setStop();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			services.service.setStop();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeLessThanOrEqual(1472);
		});

		it('sends different buffer than getXBusVersion', () => {
			services.service.setStop();
			const stopBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getXBusVersion();
			const versionBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(stopBuffer).not.toEqual(versionBuffer);
		});

		it('sends different buffer than getStatus', () => {
			services.service.setStop();
			const stopBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getStatus();
			const statusBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(stopBuffer).not.toEqual(statusBuffer);
		});

		it('sends different buffer than track power commands', () => {
			services.service.setStop();
			const stopBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.sendTrackPower(false);
			const powerBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(stopBuffer).not.toEqual(powerBuffer);
		});

		it('can be called multiple times without error', () => {
			expect(() => {
				services.service.setStop();
				services.service.setStop();
				services.service.setStop();
			}).not.toThrow();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);
		});

		it('includes valid XOR checksum in buffer', () => {
			services.service.setStop();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const checksumByte = buffer.at(-1) as number;
			expect(checksumByte).toBe(0x80);
		});
	});

	describe('getFirmwareVersion', () => {
		it('sends firmware version request command to UDP', () => {
			services.service.getFirmwareVersion();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.getFirmwareVersion();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getFirmwareVersion();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_X formatted message with correct structure', () => {
			services.service.getFirmwareVersion();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0040);
		});

		it('sends different buffer than getXBusVersion method', () => {
			services.service.getFirmwareVersion();
			const firmwareBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getXBusVersion();
			const xbusBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(firmwareBuffer).not.toEqual(xbusBuffer);
		});

		it('sends buffer with non-zero length', () => {
			services.service.getFirmwareVersion();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			services.service.getFirmwareVersion();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeLessThanOrEqual(1472);
		});

		it('sends different buffer than track power commands', () => {
			services.service.getFirmwareVersion();
			const firmwareBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.sendTrackPower(true);
			const powerBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(firmwareBuffer).not.toEqual(powerBuffer);
		});

		it('sends different buffer than setStop command', () => {
			services.service.getFirmwareVersion();
			const firmwareBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.setStop();
			const stopBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(firmwareBuffer).not.toEqual(stopBuffer);
		});

		it('can be called multiple times without error', () => {
			expect(() => {
				services.service.getFirmwareVersion();
				services.service.getFirmwareVersion();
				services.service.getFirmwareVersion();
			}).not.toThrow();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);
		});
	});

	describe('edge cases across all methods', () => {
		it('handles rapid successive calls to different methods', () => {
			expect(() => {
				services.service.sendTrackPower(true);
				services.service.getStatus();
				services.service.setStop();
				services.service.getXBusVersion();
				services.service.getFirmwareVersion();
			}).not.toThrow();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(5);
		});

		it('all status query methods produce different buffers', () => {
			services.service.getXBusVersion();
			const versionBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getStatus();
			const statusBuffer = services.udp.sendRaw.mock.calls[1][0];

			services.service.setStop();
			const stopBuffer = services.udp.sendRaw.mock.calls[2][0];

			expect(versionBuffer).not.toEqual(statusBuffer);
			expect(statusBuffer).not.toEqual(stopBuffer);
			expect(versionBuffer).not.toEqual(stopBuffer);
		});

		it('track power and stop commands produce different buffers', () => {
			services.service.sendTrackPower(true);
			const trackPowerBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.setStop();
			const stopBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(trackPowerBuffer).not.toEqual(stopBuffer);
		});

		it('all methods send valid buffer structures', () => {
			const methods = [
				() => services.service.sendTrackPower(true),
				() => services.service.setLocoDrive(100, 0.5, 'FWD'),
				() => services.service.setLocoFunction(100, 0, 0b01),
				() => services.service.getLocoInfo(100),
				() => services.service.getTurnoutInfo(100),
				() => services.service.setTurnout(100, 0),
				() => services.service.setLocoEStop(100),
				() => services.service.getXBusVersion(),
				() => services.service.getStatus(),
				() => services.service.setStop(),
				() => services.service.getFirmwareVersion(),
				() => services.service.getHardwareInfo(),
				() => services.service.getCode()
			];

			methods.forEach((method) => {
				resetMocksBeforeEach({});
				method();
				const buffer = services.udp.sendRaw.mock.calls[0][0];
				expect(Buffer.isBuffer(buffer)).toBe(true);
				expect(buffer.length).toBeGreaterThan(0);
				expect(buffer.length).toBeLessThanOrEqual(1472);
			});
		});
	});

	describe('getHardwareInfo', () => {
		it('sends hardware info request command to UDP', () => {
			services.service.getHardwareInfo();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.getHardwareInfo();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getHardwareInfo();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_GET_HWINFO formatted message with correct structure', () => {
			services.service.getHardwareInfo();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x001a);
		});

		it('sends buffer with non-zero length', () => {
			services.service.getHardwareInfo();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			services.service.getHardwareInfo();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeLessThanOrEqual(1472);
		});

		it('sends different buffer than firmware version command', () => {
			services.service.getHardwareInfo();
			const hwinfoBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getFirmwareVersion();
			const firmwareBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(hwinfoBuffer).not.toEqual(firmwareBuffer);
		});

		it('sends different buffer than version command', () => {
			services.service.getHardwareInfo();
			const hwinfoBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getXBusVersion();
			const versionBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(hwinfoBuffer).not.toEqual(versionBuffer);
		});

		it('sends different buffer than track power commands', () => {
			services.service.getHardwareInfo();
			const hwinfoBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.sendTrackPower(true);
			const powerBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(hwinfoBuffer).not.toEqual(powerBuffer);
		});

		it('can be called multiple times without error', () => {
			expect(() => {
				services.service.getHardwareInfo();
				services.service.getHardwareInfo();
				services.service.getHardwareInfo();
			}).not.toThrow();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);
		});
	});

	describe('getCode', () => {
		it('sends code request command to UDP', () => {
			services.service.getCode();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.getCode();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getCode();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_GET_CODE formatted message with correct structure', () => {
			services.service.getCode();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0018);
		});

		it('sends buffer with non-zero length', () => {
			services.service.getCode();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBeGreaterThan(0);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			services.service.getCode();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeLessThanOrEqual(1472);
		});

		it('sends different buffer than hardware info command', () => {
			services.service.getCode();
			const codeBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getHardwareInfo();
			const hwinfoBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(codeBuffer).not.toEqual(hwinfoBuffer);
		});

		it('sends different buffer than firmware version command', () => {
			services.service.getCode();
			const codeBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getFirmwareVersion();
			const firmwareBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(codeBuffer).not.toEqual(firmwareBuffer);
		});

		it('sends different buffer than version command', () => {
			services.service.getCode();
			const codeBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.getXBusVersion();
			const versionBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(codeBuffer).not.toEqual(versionBuffer);
		});

		it('sends different buffer than track power commands', () => {
			services.service.getCode();
			const codeBuffer = services.udp.sendRaw.mock.calls[0][0];

			services.service.sendTrackPower(true);
			const powerBuffer = services.udp.sendRaw.mock.calls[1][0];

			expect(codeBuffer).not.toEqual(powerBuffer);
		});

		it('can be called multiple times without error', () => {
			expect(() => {
				services.service.getCode();
				services.service.getCode();
				services.service.getCode();
			}).not.toThrow();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(3);
		});
	});

	describe('sendCvRead', () => {
		it('sends CV read command for CV1', () => {
			services.service.sendCvRead(1);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
			expect(services.logger.debug).toHaveBeenCalledWith('[z21] tx CV_READ', expect.objectContaining({ cvAddress: 1 }));
		});

		it('sends CV read command for CV29', () => {
			services.service.sendCvRead(29);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
			expect(services.logger.debug).toHaveBeenCalledWith('[z21] tx CV_READ', expect.objectContaining({ cvAddress: 29 }));
		});

		it('sends CV read command for high address CV1024', () => {
			services.service.sendCvRead(1024);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
		});
	});

	describe('sendCvWrite', () => {
		it('sends CV write command for CV1 with value 3', () => {
			services.service.sendCvWrite(1, 3);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
			expect(services.logger.debug).toHaveBeenCalledWith('[z21] tx CV_WRITE', expect.objectContaining({ cvAddress: 1, cvValue: 3 }));
		});

		it('sends CV write command for CV29 with value 42', () => {
			services.service.sendCvWrite(29, 42);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
			expect(services.logger.debug).toHaveBeenCalledWith(
				'[z21] tx CV_WRITE',
				expect.objectContaining({ cvAddress: 29, cvValue: 42 })
			);
		});

		it('sends CV write with value 0', () => {
			services.service.sendCvWrite(1, 0);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
		});

		it('sends CV write with value 255', () => {
			services.service.sendCvWrite(1, 255);

			expectUdpCalled(1);
			const buffer = extractBuffer(0);
			expectValidBuffer(buffer);
		});
	});

	describe('getBroadcastFlags', () => {
		it('sends broadcast flags request command to UDP', () => {
			services.service.getBroadcastFlags();

			expect(services.udp.sendRaw).toHaveBeenCalledTimes(1);
			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
		});

		it('always produces same buffer for repeated calls', () => {
			services.service.getBroadcastFlags();
			const buffer1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getBroadcastFlags();
			const buffer2 = services.udp.sendRaw.mock.calls[1][0];

			expect(buffer1).toEqual(buffer2);
		});

		it('sends LAN_GET_BROADCASTFLAGS formatted message with correct header', () => {
			services.service.getBroadcastFlags();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			const len = buffer.readUInt16LE(0);
			expect(len).toBe(buffer.length);
			const lanHeader = buffer.readUInt16LE(2);
			expect(lanHeader).toBe(0x0051);
		});

		it('produces buffer that can be sent directly over UDP', () => {
			services.service.getBroadcastFlags();

			const buffer = services.udp.sendRaw.mock.calls[0][0];
			expect(Buffer.isBuffer(buffer)).toBe(true);
			expect(buffer.length).toBeLessThanOrEqual(1472);
		});

		it('sends different buffer than getCode command', () => {
			services.service.getBroadcastFlags();
			const b1 = services.udp.sendRaw.mock.calls[0][0];

			services.service.getCode();
			const b2 = services.udp.sendRaw.mock.calls[1][0];

			expect(b1).not.toEqual(b2);
		});
	});
});
