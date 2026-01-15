/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LocoManager } from '@application-platform/domain';
import * as z21 from '@application-platform/z21';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { Z21EventHandler, type BroadcastFn } from './z21-service';

vi.mock('@application-platform/z21', async () => {
	const actual = await vi.importActual('@application-platform/z21');
	return { ...actual, deriveTrackFlagsFromSystemState: vi.fn(actual.deriveTrackFlagsFromSystemState) };
});

describe('Z21EventHandler.handle', () => {
	let broadcast: MockedFunction<BroadcastFn>;
	let trackStatusManager: {
		updateFromXbusPower: Mock;
		updateFromSystemState: Mock;
		getStatus: Mock;
	};
	let handler: Z21EventHandler;
	let locoManager: MockedFunction<LocoManager>;

	beforeEach(() => {
		broadcast = vi.fn();
		trackStatusManager = {
			updateFromXbusPower: vi.fn().mockReturnValue({ short: false }),
			updateFromSystemState: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			getStatus: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined })
		};
		locoManager = vi.fn();
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
			events: [{ type: 'ds.system.state', state: { centralState: 1, centralStateEx: 2 } }]
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
			datasets: [],
			events: [{ type: 'event.track.power' as const, on: true }]
		} as any;

		handler.handle(payload);

		expect(trackStatusManager.updateFromXbusPower).toHaveBeenCalledWith(true);
		expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: true, short: true });
	});

	it('updates track status from system.state events and broadcasts derived power state', () => {
		vi.spyOn(trackStatusManager, 'getStatus').mockReturnValue({ powerOn: true, short: true, emergencyStop: false });
		(z21.deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ powerOn: true, emergencyStop: false, short: true });
		trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: true, short: true, emergencyStop: false });
		const payload = {
			header: 0,
			len: 0,
			type: 'datasets' as const,
			rawHex: '0x04',
			from: { address: '127.0.0.1', port: 21105 },
			datasets: [
				{ kind: 'ds.system.state', from: { address: '127.0.0.1', port: 21105 }, payload: { centralState: 3, centralStateEx: 4 } }
			],
			events: [
				{
					type: 'event.z21.status' as const,
					payload: { centralState: 3, centralStateEx: 4 }
				}
			]
		} as any;

		handler.handle(payload);

		expect(z21.deriveTrackFlagsFromSystemState).toHaveBeenCalledWith({ centralState: 3, centralStateEx: 4 });
		expect(trackStatusManager.updateFromSystemState).toHaveBeenCalledWith({ powerOn: true, emergencyStop: false, short: true });
		expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: true, short: true, emergencyStop: false });
	});

	it('ignores non-dataset payload types that are neither serial nor system.state', () => {
		const payload = {
			type: 'ds.unknown' as any,
			rawHex: '0x05'
		} as any;

		handler.handle(payload as any);

		expect(broadcast).not.toHaveBeenCalled();
	});

	it('forwards loco.info events to locoManager and broadcasts loco.message.state', () => {
		// prepare locoManager to return a loco state when updateLocoInfoFromZ21 is called
		locoManager = {
			updateLocoInfoFromZ21: vi.fn().mockReturnValue({ addr: 42, state: { speed: 0.5, dir: 'FWD', fns: [true, false] } })
		} as unknown as MockedFunction<any>;
		// recreate handler with the new locoManager mock
		handler = new Z21EventHandler(trackStatusManager as any, broadcast, locoManager as any);

		const locoInfoEvent = {
			type: 'event.loco.info' as const,
			addr: 42,
			// payload shape is not strictly validated here, pass-through to locoManager
			state: { speed: 0.5, dir: 'FWD', fns: [true, false] }
		} as any;

		const payload = {
			type: 'datasets' as const,
			rawHex: '0x99',
			from: { address: '127.0.0.1', port: 21105 },
			datasets: [],
			events: [locoInfoEvent]
		} as any;

		handler.handle(payload);

		expect((locoManager as any).updateLocoInfoFromZ21).toHaveBeenCalledWith(locoInfoEvent);
		expect(broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			addr: 42,
			speed: 0.5,
			dir: 'FWD',
			fns: [true, false]
		});
	});
});
