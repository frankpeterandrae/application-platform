/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { datasetsToEvents, deriveTrackFlagsFromSystemState, parseZ21Datagram } from '@application-platform/z21';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { Z21EventHandler, type BroadcastFn } from './z21-service';

vi.mock('@application-platform/z21', async () => {
	const actual = await vi.importActual('@application-platform/z21');
	return {
		...actual,
		deriveTrackFlagsFromSystemState: vi.fn(),
		parseZ21Datagram: vi.fn(() => []),
		datasetsToEvents: vi.fn(() => []),
		decodeSystemState: vi.fn((state) => ({
			mainCurrent_mA: state[0] | (state[1] << 8),
			progCurrent_mA: state[2] | (state[3] << 8),
			filteredMainCurrent_mA: state[4] | (state[5] << 8),
			temperature_C: state[6] | (state[7] << 8),
			supplyVoltage_mV: state[8] | (state[9] << 8),
			vccVoltage_mV: state[10] | (state[11] << 8),
			centralState: state[12],
			centralStateEx: state[13],
			capabilities: state[14] | (state[15] << 8)
		}))
	};
});

describe('Z21EventHandler.handleDatagram', () => {
	let broadcast: MockedFunction<BroadcastFn>;
	let trackStatusManager: {
		updateFromXbusPower: Mock;
		updateFromSystemState: Mock;
		getStatus: Mock;
	};
	let handler: Z21EventHandler;
	let locoManager: {
		getState: Mock;
		getAllStates: Mock;
		setSpeed: Mock;
		setFunction: Mock;
		stopAll: Mock;
		ensureLoco: Mock;
		subscribeLocoInfoOnce: Mock;
		updateLocoInfoFromZ21: Mock;
		locos: Mock;
		locoInfoSubscribed: Mock;
		clamp01: Mock;
	};

	beforeEach(() => {
		broadcast = vi.fn();
		trackStatusManager = {
			updateFromXbusPower: vi.fn().mockReturnValue({ short: false }),
			updateFromSystemState: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			getStatus: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined })
		};
		locoManager = {
			getState: vi.fn(),
			getAllStates: vi.fn(),
			setSpeed: vi.fn(),
			setFunction: vi.fn(),
			stopAll: vi.fn(),
			ensureLoco: vi.fn(),
			subscribeLocoInfoOnce: vi.fn(),
			updateLocoInfoFromZ21: vi.fn(),
			locos: vi.fn(),
			locoInfoSubscribed: vi.fn(),
			clamp01: vi.fn()
		};
		handler = new Z21EventHandler(trackStatusManager as any, broadcast, locoManager);
	});

	describe('serial datagrams', () => {
		it('forwards serial number with correct from address', () => {
			const payload = {
				raw: Buffer.from([0x08, 0x00, 0x10, 0x00, 0x7b, 0x00, 0x00, 0x00]),
				rawHex: '0x01',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.z21.rx',
				rawHex: '0x01',
				datasets: [{ kind: 'serial', serial: 123, from: { address: '127.0.0.1', port: 21105 } }],
				events: [{ type: 'serial', serial: 123 }]
			});
		});

		it('handles serial number zero', () => {
			const payload = {
				raw: Buffer.from([0x08, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00]),
				rawHex: '0x11',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					events: [{ type: 'serial', serial: 0 }]
				})
			);
		});

		it('handles maximum serial number', () => {
			const payload = {
				raw: Buffer.from([0x08, 0x00, 0x10, 0x00, 0xff, 0xff, 0xff, 0xff]),
				rawHex: '0x12',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					events: [{ type: 'serial', serial: 0xffffffff }]
				})
			);
		});

		it('preserves remote client address and port', () => {
			const payload = {
				raw: Buffer.from([0x08, 0x00, 0x10, 0x00, 0xc8, 0x01, 0x00, 0x00]),
				rawHex: '0x10',
				from: { address: '192.168.1.1', port: 54321 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					datasets: [expect.objectContaining({ from: { address: '192.168.1.1', port: 54321 } })]
				})
			);
		});
	});

	describe('system state events', () => {
		it('broadcasts trackPower with all flags from system.state', () => {
			(deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ powerOn: true, emergencyStop: false, short: true });
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: true, short: true, emergencyStop: false });
			vi.mocked(parseZ21Datagram).mockReturnValue([
				{
					kind: 'ds.system.state',
					state: new Uint8Array([0x64, 0x00, 0x32, 0x00, 0x4b, 0x00, 0x19, 0x00, 0x98, 0x3a, 0x88, 0x13, 0x03, 0x04, 0x00, 0x00])
				}
			] as any);

			const payload = {
				raw: Buffer.from([
					0x14, 0x00, 0x84, 0x00, 0x64, 0x00, 0x32, 0x00, 0x4b, 0x00, 0x19, 0x00, 0x98, 0x3a, 0x88, 0x13, 0x03, 0x04, 0x00, 0x00
				]),
				rawHex: '0x04',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				on: true,
				short: true,
				emergencyStop: false
			});
		});

		it('broadcasts emergency stop when flag is true', () => {
			(deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ powerOn: false, emergencyStop: true, short: false });
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: false, short: false, emergencyStop: true });
			vi.mocked(parseZ21Datagram).mockReturnValue([
				{
					kind: 'ds.system.state',
					state: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
				}
			] as any);

			const payload = {
				raw: Buffer.from([
					0x14, 0x00, 0x84, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
				]),
				rawHex: '0x07',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				on: false,
				short: false,
				emergencyStop: true
			});
		});

		it('broadcasts undefined when emergency stop is not set', () => {
			(deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ powerOn: true, emergencyStop: undefined, short: false });
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: true, short: false, emergencyStop: undefined });
			vi.mocked(parseZ21Datagram).mockReturnValue([
				{
					kind: 'ds.system.state',
					state: new Uint8Array([0x64, 0x00, 0x32, 0x00, 0x4b, 0x00, 0x19, 0x00, 0x98, 0x3a, 0x88, 0x13, 0x01, 0x00, 0x00, 0x00])
				}
			] as any);

			const payload = {
				raw: Buffer.from([
					0x14, 0x00, 0x84, 0x00, 0x64, 0x00, 0x32, 0x00, 0x4b, 0x00, 0x19, 0x00, 0x98, 0x3a, 0x88, 0x13, 0x01, 0x00, 0x00, 0x00
				]),
				rawHex: '0x08',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				on: true,
				short: false,
				emergencyStop: undefined
			});
		});
	});

	describe('datagram metadata preservation', () => {
		it('preserves rawHex in serial broadcasts', () => {
			const customRawHex = '0xabcdef12';
			const payload = {
				raw: Buffer.from([0x08, 0x00, 0x10, 0x00, 0x99, 0x03, 0x00, 0x00]),
				rawHex: customRawHex,
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					rawHex: customRawHex
				})
			);
		});

		it('preserves rawHex in z21.rx envelope broadcasts', () => {
			const customRawHex = '0x12345678';

			const payload = {
				raw: Buffer.from([0x06, 0x00, 0x40, 0x05, 0x61, 0x01]),
				rawHex: customRawHex,
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					rawHex: customRawHex,
					type: 'system.message.z21.rx'
				})
			);
		});

		it('preserves network source for remote clients', () => {
			const payload = {
				raw: Buffer.from([0x08, 0x00, 0x10, 0x00, 0x09, 0x03, 0x00, 0x00]),
				rawHex: '0x30',
				from: { address: '192.168.100.50', port: 65535 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					datasets: [
						expect.objectContaining({
							from: { address: '192.168.100.50', port: 65535 }
						})
					]
				})
			);
		});
	});

	describe('handler behavior', () => {
		it('broadcasts z21.rx envelope for all datagrams', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([]);
			vi.mocked(datasetsToEvents).mockReturnValue([]);

			const payload = {
				raw: Buffer.alloc(4, 0),
				rawHex: '0xf2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'system.message.z21.rx'
				})
			);
		});
	});
});
