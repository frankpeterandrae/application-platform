/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { datasetsToEvents, deriveTrackFlagsFromSystemState, parseZ21Datagram } from '@application-platform/z21';
import { TurnoutState } from '@application-platform/z21-shared';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { Z21EventHandler, type BroadcastFn } from './z21-event-handler';

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
		updateFromLanX: Mock;
		setEmergencyStop: Mock;
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
	let commandStationInfo: { setXBusVersion: Mock; setFirmwareVersion: Mock };

	beforeEach(() => {
		broadcast = vi.fn();
		trackStatusManager = {
			updateFromXbusPower: vi.fn().mockReturnValue({ short: false }),
			updateFromSystemState: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			getStatus: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			updateFromLanX: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			setEmergencyStop: vi.fn()
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
		commandStationInfo = { setXBusVersion: vi.fn(), setFirmwareVersion: vi.fn() };
		const mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		} as any;
		handler = new Z21EventHandler(trackStatusManager as any, broadcast, locoManager as any, mockLogger, commandStationInfo as any);
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

	describe('track power events', () => {
		it('broadcasts track power from xbus events using track status manager result', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.track.power', on: false }] as any);
			trackStatusManager.updateFromXbusPower.mockReturnValue({ short: true });

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xbe',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(trackStatusManager.updateFromXbusPower).toHaveBeenCalledWith(false);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				on: false,
				short: true
			});
		});

		it('broadcasts track power on when xbus reports power is on', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.track.power', on: true }] as any);
			trackStatusManager.updateFromXbusPower.mockReturnValue({ short: false });

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xbf',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(trackStatusManager.updateFromXbusPower).toHaveBeenCalledWith(true);
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				on: true,
				short: false
			});
		});
	});

	describe('event.z21.status events', () => {
		it('updates track status from LAN X status and broadcasts resulting power state', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.z21.status', status: 0x01 }] as any);
			trackStatusManager.updateFromLanX.mockReturnValue({ powerOn: true, short: false, emergencyStop: true });

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xcf',
				from: { address: '10.0.0.5', port: 12345 }
			} as any;

			handler.handleDatagram(payload);

			expect(trackStatusManager.updateFromLanX).toHaveBeenCalledWith({ type: 'event.z21.status', status: 0x01 });
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.trackpower',
				on: true,
				short: false,
				emergencyStop: true
			});
		});
	});

	describe('event.x.bus.version events', () => {
		it('broadcasts system.message.x.bus.version with version string and cmdsId', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x01, xbusVersion: 0x30, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd1',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.x.bus.version',
				version: 'V3.0',
				cmdsId: 0x01
			});
		});

		it('stores version in command station info', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			const versionEvent = { type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x02, xbusVersion: 0x30, raw: [] };
			vi.mocked(datasetsToEvents).mockReturnValue([versionEvent] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setXBusVersion).toHaveBeenCalledWith(versionEvent);
		});

		it('broadcasts with minimum cmdsId value', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V1.0', cmdsId: 0x00, xbusVersion: 0x10, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd4',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.x.bus.version',
				version: 'V1.0',
				cmdsId: 0x00
			});
		});

		it('broadcasts with maximum cmdsId value', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V4.0', cmdsId: 0xff, xbusVersion: 0x40, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd5',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.x.bus.version',
				version: 'V4.0',
				cmdsId: 0xff
			});
		});

		it('handles Unknown version string', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'Unknown', cmdsId: 0xff, xbusVersion: 0x00, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd3',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.x.bus.version',
				version: 'Unknown',
				cmdsId: 0xff
			});
		});
	});

	describe('firmware.version events', () => {
		it('broadcasts system.message.firmware.version with major and minor versions', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.firmware.version', major: 0x12, minor: 0x34, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe3',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.firmware.version',
				major: 0x12,
				minor: 0x34
			});
		});

		it('stores firmware version in command station info', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			const versionEvent = { type: 'event.firmware.version', major: 0x25, minor: 0x99, raw: [] };
			vi.mocked(datasetsToEvents).mockReturnValue([versionEvent] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe4',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setFirmwareVersion).toHaveBeenCalledWith(versionEvent);
		});

		it('broadcasts firmware version with minimum values', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.firmware.version', major: 0x00, minor: 0x00, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe5',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.firmware.version',
				major: 0x00,
				minor: 0x00
			});
		});

		it('broadcasts firmware version with maximum values', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.firmware.version', major: 0xff, minor: 0xff, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe6',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.firmware.version',
				major: 0xff,
				minor: 0xff
			});
		});

		it('broadcasts firmware version with different major and minor values', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.firmware.version', major: 0x30, minor: 0x06, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe7',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.firmware.version',
				major: 0x30,
				minor: 0x06
			});
		});
	});

	describe('event.z21.stopped events', () => {
		it('broadcasts system.message.stop when emergency stop is triggered', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.z21.stopped' }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe1',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.stop' });
		});

		it('sets emergency stop flag in track status manager', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.z21.stopped' }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(trackStatusManager.setEmergencyStop).toHaveBeenCalledWith(true, 'ds.lan.x');
		});
	});

	describe('turnout.info events', () => {
		it('broadcasts turnout state with STRAIGHT position', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.turnout.info', addr: 42, state: TurnoutState.STRAIGHT }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xf1',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'switching.message.turnout.state',
				addr: 42,
				state: TurnoutState.STRAIGHT
			});
		});

		it('broadcasts turnout state with DIVERGING position', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.turnout.info', addr: 123, state: TurnoutState.DIVERGING }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xf2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'switching.message.turnout.state',
				addr: 123,
				state: TurnoutState.DIVERGING
			});
		});

		it('handles maximum turnout address', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.turnout.info', addr: 16383, state: TurnoutState.STRAIGHT }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xf3',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'switching.message.turnout.state',
				addr: 16383,
				state: TurnoutState.STRAIGHT
			});
		});
	});

	describe('loco.info events', () => {
		beforeEach(() => {
			locoManager.updateLocoInfoFromZ21 = vi.fn().mockReturnValue({
				addr: 100,
				state: { speed: 0.5, dir: 'FWD', fns: { 0: true }, estop: false }
			});
		});

		it('broadcasts loco state with speed, direction and functions', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.loco.info', addr: 100, speed: 0.5, dir: 'FWD', fns: { 0: true } }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xg1',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'loco.message.state',
				addr: 100,
				speed: 0.5,
				dir: 'FWD',
				fns: { 0: true },
				estop: false
			});
		});

		it('updates loco manager with loco info event', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			const locoInfoEvent = { type: 'event.loco.info', addr: 200, speed: 0.8, dir: 'REV', fns: { 1: true, 5: false } };
			vi.mocked(datasetsToEvents).mockReturnValue([locoInfoEvent] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xg2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(locoManager.updateLocoInfoFromZ21).toHaveBeenCalledWith(locoInfoEvent);
		});

		it('broadcasts estop flag when locomotive is in emergency stop', () => {
			locoManager.updateLocoInfoFromZ21.mockReturnValue({
				addr: 50,
				state: { speed: 0, dir: 'FWD', fns: {}, estop: true }
			});
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.loco.info', addr: 50, speed: 0, dir: 'FWD', fns: {} }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xg3',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					estop: true
				})
			);
		});

		it('handles multiple functions in loco state', () => {
			locoManager.updateLocoInfoFromZ21.mockReturnValue({
				addr: 300,
				state: { speed: 0.3, dir: 'REV', fns: { 0: true, 1: false, 2: true, 10: true }, estop: false }
			});
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.loco.info', addr: 300, speed: 0.3, dir: 'REV', fns: { 0: true, 1: false, 2: true, 10: true } }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xg4',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					fns: { 0: true, 1: false, 2: true, 10: true }
				})
			);
		});
	});
});
