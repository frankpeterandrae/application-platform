/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

import { SpeedByteMask } from '../constants';
import { type Z21Udp } from '../udp/udp';

import { Z21Service } from './z21-service';

describe('Z21Service', () => {
	let service: Z21Service;
	let mockUdp: Mocked<Z21Udp>;

	beforeEach(() => {
		mockUdp = {
			sendRaw: vi.fn()
		} as any;
		service = new Z21Service(mockUdp);
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

	describe('demoPing', () => {
		it('sends demo payload 0xDEADBEEF to UDP', () => {
			service.demoPing();

			expect(mockUdp.sendRaw).toHaveBeenCalledTimes(1);
			expect(mockUdp.sendRaw).toHaveBeenCalledWith(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
		});

		it('sends exactly 4 bytes for demo ping', () => {
			service.demoPing();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer.length).toBe(4);
		});

		it('sends correct hex values in demo payload', () => {
			service.demoPing();

			const buffer = mockUdp.sendRaw.mock.calls[0][0];
			expect(buffer[0]).toBe(0xde);
			expect(buffer[1]).toBe(0xad);
			expect(buffer[2]).toBe(0xbe);
			expect(buffer[3]).toBe(0xef);
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
});
