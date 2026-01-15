/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { vi } from 'vitest';

import { type Z21Udp } from '../udp/udp';

import { Z21Service } from './z21-service';

describe('Z21Service', () => {
	let service: Z21Service;
	let mockUdp: vi.Mocked<Z21Udp>;

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
});
