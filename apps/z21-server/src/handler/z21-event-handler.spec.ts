/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { datasetsToEvents, deriveTrackFlagsFromSystemState, parseZ21Datagram } from '@application-platform/z21';
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
	let csInfoOrchestrator: {
		poke: Mock;
		ack: Mock;
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
	let commandStationInfo: {
		setCode: Mock;
		setXBusVersion: Mock;
		setFirmwareVersion: Mock;
		setHardwareType: Mock;
	};

	beforeEach(() => {
		broadcast = vi.fn();
		trackStatusManager = {
			updateFromXbusPower: vi.fn().mockReturnValue({ short: false }),
			updateFromSystemState: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			getStatus: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			updateFromLanX: vi.fn().mockReturnValue({ powerOn: false, short: false, emergencyStop: undefined }),
			setEmergencyStop: vi.fn()
		};
		// Configure mock return value for deriveTrackFlagsFromSystemState
		vi.mocked(deriveTrackFlagsFromSystemState).mockReturnValue({ powerOn: false, emergencyStop: false, short: false });
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
		commandStationInfo = { setXBusVersion: vi.fn(), setFirmwareVersion: vi.fn(), setHardwareType: vi.fn(), setCode: vi.fn() };
		csInfoOrchestrator = {
			poke: vi.fn(),
			ack: vi.fn()
		};
		const mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		} as any;
		handler = new Z21EventHandler(broadcast, locoManager as any, mockLogger, commandStationInfo as any, csInfoOrchestrator as any);
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
				datasets: [{ kind: 'ds.serial', serial: 123, from: { address: '127.0.0.1', port: 21105 } }],
				events: [{ type: 'event.serial', serial: 123 }]
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
					events: [{ type: 'event.serial', serial: 0 }]
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
					events: [{ type: 'event.serial', serial: 0xffffffff }]
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
		it('broadcasts trackPower message when system state is received', () => {
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

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'system.message.trackpower'
				})
			);
		});

		it('includes track power state in broadcast', () => {
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

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'system.message.trackpower',
					on: expect.any(Boolean),
					short: expect.any(Boolean)
				})
			);
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

	describe('z21.x.bus.version events', () => {
		it('broadcasts system.x.bus.version with xBusVersion string and cmdsId', () => {
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

		it('stores xBusVersion in command station info', () => {
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

		it('handles Unknown xBusVersion string', () => {
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

		it('sets hardware type to Z21_OLD when cmdsId is 0x12', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x12, xbusVersion: 0x30, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd6',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setHardwareType).toHaveBeenCalledWith('Z21_OLD');
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.hardware.info',
				hardwareType: 'Z21_OLD'
			});
		});

		it('sets hardware type to z21_START when cmdsId is 0x13', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.6', cmdsId: 0x13, xbusVersion: 0x36, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd7',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setHardwareType).toHaveBeenCalledWith('z21_START');
			expect(broadcast).toHaveBeenCalledWith({
				type: 'system.message.hardware.info',
				hardwareType: 'z21_START'
			});
		});

		it('does not set hardware type when cmdsId is neither 0x12 nor 0x13', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x14, xbusVersion: 0x30, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd8',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setHardwareType).not.toHaveBeenCalled();
			expect(broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'event.system.hardware.info' }));
		});

		it('calls csInfoOrchestrator poke and ack after processing xBusVersion', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x01, xbusVersion: 0x30, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd9',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(csInfoOrchestrator.poke).toHaveBeenCalled();
			expect(csInfoOrchestrator.ack).toHaveBeenCalledWith('xbusVersion');
		});

		it('calls orchestrator in correct order for cmdsId 0x12', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x12, xbusVersion: 0x30, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xda',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			const pokeCall = csInfoOrchestrator.poke.mock.invocationCallOrder[0];
			const ackCall = csInfoOrchestrator.ack.mock.invocationCallOrder[0];
			expect(ackCall).toBeGreaterThan(pokeCall);
		});
	});

	describe('z21.firmware.version events', () => {
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

		it('calls csInfoOrchestrator poke and ack after processing firmware version', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.firmware.version', major: 0x12, minor: 0x34, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe8',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(csInfoOrchestrator.poke).toHaveBeenCalled();
			expect(csInfoOrchestrator.ack).toHaveBeenCalledWith('firmware');
		});

		it('calls orchestrator in correct order for firmware version', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.firmware.version', major: 0x01, minor: 0x20, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe9',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			const pokeCall = csInfoOrchestrator.poke.mock.invocationCallOrder[0];
			const ackCall = csInfoOrchestrator.ack.mock.invocationCallOrder[0];
			expect(ackCall).toBeGreaterThan(pokeCall);
		});
	});

	describe('z21.stopped events', () => {
		it('broadcasts system.stop when emergency stop is triggered', () => {
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
	});

	// Note: z21.hwinfo and z21.code datasets are not passed to datasetsToEvents in the current implementation
	// (only x.bus and system.state are processed). Once support is added, targeted tests should be added here.

	describe('turnout.info events', () => {
		it('broadcasts turnout state with STRAIGHT position', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.turnout.info', addr: 42, state: 'STRAIGHT' }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xf1',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'switching.message.turnout.state',
				addr: 42,
				state: 'STRAIGHT'
			});
		});

		it('broadcasts turnout state with DIVERGING position', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.turnout.info', addr: 123, state: 'DIVERGING' }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xf2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'switching.message.turnout.state',
				addr: 123,
				state: 'DIVERGING'
			});
		});

		it('handles maximum turnout address', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.turnout.info', addr: 16383, state: 'STRAIGHT' }] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xf3',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({
				type: 'switching.message.turnout.state',
				addr: 16383,
				state: 'STRAIGHT'
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

	describe('z21.hwinfo events', () => {
		it('broadcasts firmware and hardware info and acks orchestrator', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.hwinfo', hwtype: 0x00000204, fwVersionBcd: 0x00000125 }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([
				{ type: 'event.z21.hwinfo', payload: { hardwareType: 'z21_START', majorVersion: 1, minorVersion: 25 }, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x0c, 0x00, 0x1a, 0x00, 0x04, 0x02, 0x00, 0x00, 0x25, 0x01, 0x00, 0x00]),
				rawHex: '0xh5',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setFirmwareVersion).toHaveBeenCalledWith({ major: 1, minor: 25 });
			expect(commandStationInfo.setHardwareType).toHaveBeenCalledWith('z21_START');
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.firmware.version', major: 1, minor: 25 });
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.hardware.info', hardwareType: 'z21_START' });
			expect(csInfoOrchestrator.ack).toHaveBeenCalledWith('hwinfo');
			const pokeCall = csInfoOrchestrator.poke.mock.invocationCallOrder[0];
			const ackCall = csInfoOrchestrator.ack.mock.invocationCallOrder[0];
			expect(ackCall).toBeGreaterThan(pokeCall);
		});
	});

	describe('z21.code events', () => {
		it('broadcasts code and stores it then acks orchestrator', () => {
			vi.mocked(parseZ21Datagram).mockReturnValue([{ kind: 'ds.code', code: 2 }] as any);
			vi.mocked(datasetsToEvents).mockReturnValue([{ type: 'event.z21.code', code: 2, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x05, 0x00, 0x18, 0x00, 0x02]),
				rawHex: '0xc2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setCode).toHaveBeenCalledWith(2);
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.z21.code', code: 2 });
			expect(csInfoOrchestrator.ack).toHaveBeenCalledWith('code');
		});
	});
});
