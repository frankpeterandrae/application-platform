/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

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
	describe('event.turnout.info', () => {
		it('broadcasts turnout state when turnout.info event is received', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xa1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.turnout.info' as const, addr: 10, state: 'STRAIGHT' as const }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'switching.message.turnout.state', addr: 10, state: 'STRAIGHT' });
		});

		it('broadcasts DIVERGING state for turnouts', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xa2',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.turnout.info' as const, addr: 20, state: 'DIVERGING' as const }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'switching.message.turnout.state', addr: 20, state: 'DIVERGING' });
		});

		it('broadcasts UNKNOWN state for turnouts', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xa3',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.turnout.info' as const, addr: 30, state: 'UNKNOWN' as const }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'switching.message.turnout.state', addr: 30, state: 'UNKNOWN' });
		});

		it('handles minimum turnout address', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xa4',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.turnout.info' as const, addr: 0, state: 'STRAIGHT' as const }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'switching.message.turnout.state', addr: 0, state: 'STRAIGHT' });
		});

		it('handles maximum turnout address', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xa5',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.turnout.info' as const, addr: 16383, state: 'DIVERGING' as const }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'switching.message.turnout.state', addr: 16383, state: 'DIVERGING' });
		});
	});

	describe('event.track.power', () => {
		it('broadcasts power OFF when track.power event indicates OFF', () => {
			trackStatusManager.updateFromXbusPower.mockReturnValue({ short: false });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xb1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.track.power' as const, on: false }]
			} as any;

			handler.handle(payload);

			expect(trackStatusManager.updateFromXbusPower).toHaveBeenCalledWith(false);
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: false, short: false });
		});

		it('includes short circuit status from track status manager', () => {
			trackStatusManager.updateFromXbusPower.mockReturnValue({ short: true });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xb2',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.track.power' as const, on: true }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ short: true }));
		});

		it('defaults short to false when track status manager returns undefined', () => {
			trackStatusManager.updateFromXbusPower.mockReturnValue({ short: undefined });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xb3',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.track.power' as const, on: true }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ short: false }));
		});
	});

	describe('event.z21.status', () => {
		it('derives track flags and updates track status manager', () => {
			(z21.deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ powerOn: false, short: true });
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: false, short: true, emergencyStop: false });
			trackStatusManager.getStatus.mockReturnValue({ powerOn: false, short: true, emergencyStop: false });

			const payload = {
				type: 'datasets' as const,
				rawHex: '0xc1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.z21.status' as const, payload: { centralState: 0x06, centralStateEx: 0x00 } }]
			} as any;

			handler.handle(payload);

			expect(z21.deriveTrackFlagsFromSystemState).toHaveBeenCalledWith({ centralState: 0x06, centralStateEx: 0x00 });
			expect(trackStatusManager.updateFromSystemState).toHaveBeenCalledWith({ powerOn: false, short: true });
		});

		it('defaults powerOn to false when updateFromSystemState returns undefined', () => {
			(z21.deriveTrackFlagsFromSystemState as Mock).mockReturnValue({});
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: undefined, short: false });
			trackStatusManager.getStatus.mockReturnValue({ powerOn: undefined, short: false });

			const payload = {
				type: 'datasets' as const,
				rawHex: '0xc2',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.z21.status' as const, payload: { centralState: 0x00, centralStateEx: 0x00 } }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ on: false }));
		});

		it('defaults short to false when updateFromSystemState returns undefined', () => {
			(z21.deriveTrackFlagsFromSystemState as Mock).mockReturnValue({});
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: true, short: undefined });
			trackStatusManager.getStatus.mockReturnValue({ powerOn: true, short: undefined });

			const payload = {
				type: 'datasets' as const,
				rawHex: '0xc3',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.z21.status' as const, payload: { centralState: 0x00, centralStateEx: 0x00 } }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ short: false }));
		});

		it('includes emergencyStop flag in broadcast', () => {
			(z21.deriveTrackFlagsFromSystemState as Mock).mockReturnValue({ emergencyStop: true });
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: true, short: false, emergencyStop: true });
			trackStatusManager.getStatus.mockReturnValue({ powerOn: true, short: false, emergencyStop: true });

			const payload = {
				type: 'datasets' as const,
				rawHex: '0xc4',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.z21.status' as const, payload: { centralState: 0x01, centralStateEx: 0x00 } }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ emergencyStop: true }));
		});

		it('handles all central state flags', () => {
			(z21.deriveTrackFlagsFromSystemState as Mock).mockReturnValue({
				powerOn: false,
				short: true,
				emergencyStop: true
			});
			trackStatusManager.updateFromSystemState.mockReturnValue({ powerOn: false, short: true, emergencyStop: true });
			trackStatusManager.getStatus.mockReturnValue({ powerOn: false, short: true, emergencyStop: true });

			const payload = {
				type: 'datasets' as const,
				rawHex: '0xc5',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.z21.status' as const, payload: { centralState: 0x07, centralStateEx: 0x00 } }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: false, short: true, emergencyStop: true });
		});
	});

	describe('event.loco.info', () => {
		beforeEach(() => {
			locoManager = {
				updateLocoInfoFromZ21: vi.fn().mockReturnValue({ addr: 100, state: { speed: 0, dir: 'FWD', fns: {} } })
			} as unknown as MockedFunction<any>;
			handler = new Z21EventHandler(trackStatusManager as any, broadcast, locoManager as any);
		});

		it('broadcasts loco state with speed 0', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({ addr: 100, state: { speed: 0, dir: 'FWD', fns: {} } });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 100 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ speed: 0 }));
		});

		it('broadcasts loco state with maximum speed', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({ addr: 100, state: { speed: 1, dir: 'FWD', fns: {} } });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd2',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 100 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ speed: 1 }));
		});

		it('broadcasts loco state with FWD direction', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({ addr: 100, state: { speed: 0.5, dir: 'FWD', fns: {} } });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd3',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 100 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ dir: 'FWD' }));
		});

		it('broadcasts loco state with REV direction', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({ addr: 100, state: { speed: 0.5, dir: 'REV', fns: {} } });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd4',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 100 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ dir: 'REV' }));
		});

		it('broadcasts loco state with multiple functions active', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({
				addr: 200,
				state: { speed: 0.75, dir: 'FWD', fns: { 0: true, 5: true, 10: false } }
			});
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd5',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 200 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ fns: { 0: true, 5: true, 10: false } }));
		});

		it('handles minimum locomotive address', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({ addr: 1, state: { speed: 0, dir: 'FWD', fns: {} } });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd6',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 1 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ addr: 1 }));
		});

		it('handles maximum locomotive address', () => {
			(locoManager as any).updateLocoInfoFromZ21.mockReturnValue({ addr: 9999, state: { speed: 0, dir: 'FWD', fns: {} } });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xd7',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: [{ type: 'event.loco.info' as const, addr: 9999 }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ addr: 9999 }));
		});
	});

	describe('event.unknown.x.bus', () => {
		it('does not broadcast z21.rx when events array contains any event', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xe1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [{ kind: 'unknown', data: 'test' }],
				events: [{ type: 'event.unknown.x.bus', xHeader: 0xff, bytes: [0x01, 0x02] }]
			} as any;

			handler.handle(payload);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('does not broadcast z21.rx when a known event type is processed', () => {
			trackStatusManager.updateFromXbusPower.mockReturnValue({ short: false });
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xe2',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [{ kind: 'ds.x.bus', xHeader: 0x61, data: new Uint8Array([0x61, 0x01]) }],
				events: [{ type: 'event.track.power' as const, short: false, on: true }]
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledTimes(1);
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.trackpower', on: true, short: false });
		});
	});

	describe('empty events array', () => {
		it('broadcasts z21.rx with empty events array', () => {
			const payload = {
				type: 'datasets' as const,
				rawHex: '0xf1',
				from: { address: '127.0.0.1', port: 21105 },
				datasets: [],
				events: []
			} as any;

			handler.handle(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.z21.rx',
				rawHex: '0xf1',
				datasets: [],
				events: []
			});
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
