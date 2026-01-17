/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { deriveTrackFlagsFromSystemState } from '@application-platform/z21';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { Z21EventHandler, type BroadcastFn } from './z21-service';

vi.mock('@application-platform/z21', async () => {
	const actual = await vi.importActual('@application-platform/z21');
	return { ...actual, deriveTrackFlagsFromSystemState: vi.fn() };
});

describe('Z21EventHandler.handle', () => {
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

	it('forwards serial payloads to clients with raw dataset and event', () => {
		const payload = {
			header: 0,
			len: 0,
			type: 'serial' as const,
			rawHex: '0x01',
			serial: 123,
			from: { address: '127.0.0.1', port: 21105 }
		} as any;

		handler.handle(payload);

		expect(broadcast).toHaveBeenCalledTimes(1);
		expect(broadcast).toHaveBeenCalledWith({
			type: 'system.message.z21.rx',
			rawHex: '0x01',
			datasets: [{ kind: 'serial', serial: 123, from: { address: '127.0.0.1', port: 21105 } }],
			events: [{ type: 'serial', serial: 123 }]
		});
	});

	it('forwards system.state snapshots to clients', () => {
		const payload = {
			header: 0,
			len: 0,
			type: 'system.state' as const,
			rawHex: '0x02',
			payload: { centralState: 1, centralStateEx: 2 },
			from: { address: '127.0.0.1', port: 21105 }
		} as any;

		handler.handle(payload);

		expect(broadcast).toHaveBeenCalledTimes(1);
		expect(broadcast).toHaveBeenCalledWith({
			type: 'system.message.z21.rx',
			rawHex: '0x02',
			datasets: [
				{ kind: 'ds.system.state', from: { address: '127.0.0.1', port: 21105 }, payload: { centralState: 1, centralStateEx: 2 } }
			],
			events: [{ type: 'event.system.state', state: { centralState: 1, centralStateEx: 2 } }]
		});
	});

	it('updates and broadcasts track power when x-bus event is received', () => {
		trackStatusManager.updateFromXbusPower.mockReturnValue({ short: true });
		const payload = {
			header: 0,
			len: 0,
			type: 'datasets' as const,
			rawHex: '0x03',
			from: { address: '127.0.0.1', port: 21105 },
			datasets: [
				{
					kind: 'ds.x.bus' as const,
					xHeader: 0x61,
					data: new Uint8Array([0x61, 0x01])
				}
			]
		} as any;

		handler.handle(payload);
		expect(trackStatusManager.updateFromXbusPower).toHaveBeenCalledWith(true);
		expect(broadcast).toHaveBeenCalledWith({
			type: 'system.message.trackpower',
			on: true,
			short: true
		});
	});

	it('processes system.state events from datasets and broadcasts system.message.trackpower', () => {
		vi.spyOn(trackStatusManager, 'getStatus').mockReturnValue({ powerOn: true, short: true, emergencyStop: false });
		(deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ powerOn: true, emergencyStop: false, short: true });
		trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: true, short: true, emergencyStop: false });

		const systemStatePayload = {
			mainCurrent_mA: 100,
			progCurrent_mA: 50,
			filteredMainCurrent_mA: 75,
			temperature_C: 25,
			supplyVoltage_mV: 15000,
			vccVoltage_mV: 5000,
			centralState: 0x03,
			centralStateEx: 0x04,
			capabilities: 0
		};

		const payload = {
			header: 0,
			len: 0,
			type: 'datasets' as const,
			rawHex: '0x04',
			from: { address: '127.0.0.1', port: 21105 },
			datasets: [
				{
					kind: 'ds.system.state' as const,
					state: new Uint8Array(16)
				}
			]
		} as any;

		handler.handle(payload);

		expect(broadcast).toHaveBeenCalledWith({
			type: 'system.message.trackpower',
			on: true,
			short: true,
			emergencyStop: false
		});
	});

	it('processes loco.info events from datasets and broadcasts loco.message.state', () => {
		// prepare locoManager to return a loco state when updateLocoInfoFromZ21 is called
		locoManager = {
			updateLocoInfoFromZ21: vi.fn().mockReturnValue({ addr: 100, state: { speed: 0.5, dir: 'FWD', fns: { 0: true }, estop: false } })
		} as unknown as MockedFunction<any>;
		// recreate handler with the new locoManager mock
		handler = new Z21EventHandler(trackStatusManager as any, broadcast, locoManager as any);

		const payload = {
			type: 'datasets' as const,
			rawHex: '0x99',
			from: { address: '127.0.0.1', port: 21105 },
			datasets: [
				{
					kind: 'ds.x.bus' as const,
					xHeader: 0xef,
					data: new Uint8Array([0xef, 0xc0, 0x64, 0x00, 0x84, 0x01])
				}
			]
		} as any;

		handler.handle(payload);

		expect(locoManager.updateLocoInfoFromZ21).toHaveBeenCalled();
		expect(broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			addr: 100,
			speed: 0.5,
			dir: 'FWD',
			fns: { 0: true },
			estop: false
		});
	});

	it('processes turnout.info events from datasets and broadcasts switching.message.turnout.state', () => {
		const payload = {
			type: 'datasets' as const,
			rawHex: '0x9a',
			from: { address: '127.0.0.1', port: 21105 },
			datasets: [
				{
					kind: 'ds.x.bus' as const,
					xHeader: 0x43,
					data: new Uint8Array([0x43, 0x00, 0x0a, 0x01])
				}
			]
		} as any;

		handler.handle(payload);

		expect(broadcast).toHaveBeenCalledWith({
			type: 'switching.message.turnout.state',
			addr: 10,
			state: 'STRAIGHT'
		});
	});

	describe('empty events array', () => {
		it('does not broadcast when datasets array is empty', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xf1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: []
			} as any;

			handler.handle(payload);

			expect(broadcast).not.toHaveBeenCalled();
		});
	});

	describe('serial payloads', () => {
		it('includes correct from address and port', () => {
			const payload = {
				type: 'serial' as const,
				rawHex: '0x10',
				serial: 456,
				from: { address: '192.168.1.1', port: 54321 }
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					datasets: [expect.objectContaining({ from: { address: '192.168.1.1', port: 54321 } })]
				})
			);
		});

		it('handles serial number 0', () => {
			const payload = {
				type: 'serial' as const,
				rawHex: '0x11',
				serial: 0,
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					events: [{ type: 'serial', serial: 0 }]
				})
			);
		});

		it('handles maximum serial number', () => {
			const payload = {
				type: 'serial' as const,
				rawHex: '0x12',
				serial: 0xffffffff,
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					events: [{ type: 'serial', serial: 0xffffffff }]
				})
			);
		});
	});

	describe('system.state payloads', () => {
		it('includes from address and port in datasets', () => {
			const payload = {
				type: 'system.state' as const,
				rawHex: '0x20',
				payload: { centralState: 0, centralStateEx: 0 },
				from: { address: '10.0.0.1', port: 12345 }
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					datasets: [expect.objectContaining({ from: { address: '10.0.0.1', port: 12345 } })]
				})
			);
		});

		it('forwards complete payload object in events', () => {
			const statePayload = {
				mainCurrent_mA: 100,
				progCurrent_mA: 50,
				centralState: 0x03,
				centralStateEx: 0x01
			};
			const payload = {
				type: 'system.state' as const,
				rawHex: '0x21',
				payload: statePayload,
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					events: [{ type: 'event.system.state', state: statePayload }]
				})
			);
		});
	});
});
