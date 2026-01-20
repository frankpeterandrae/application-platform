/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommandStationInfo, LocoManager } from '@application-platform/domain';
import { DeepMocked, Mock, resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { Logger } from '@application-platform/z21-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';
import { CvProgrammingService } from '../services/cv-programming-service';

import { BroadcastFn, Z21EventHandler } from './z21-event-handler';

// Create mocks for z21 parsing helpers and inject them into module import
const z21Mocks = Mock<{ parseZ21Datagram: (raw: Uint8Array) => any[]; datasetsToEvents: (datasets: any[]) => any[] }>();

// Mock the Z21 parsing functions but avoid hoisting issues by using doMock
vi.doMock('@application-platform/z21', async () => {
	const actual = await vi.importActual<typeof import('@application-platform/z21')>('@application-platform/z21');
	return {
		...actual,
		parseZ21Datagram: z21Mocks.parseZ21Datagram,
		datasetsToEvents: z21Mocks.datasetsToEvents
	};
});

describe('Z21EventHandler.handleDatagram', () => {
	let broadcast: vi.MockedFunction<BroadcastFn>;
	let locoManager: DeepMocked<LocoManager>;
	let commandStationInfo: DeepMocked<CommandStationInfo>;
	let csInfoOrchestrator: DeepMocked<CommandStationInfoOrchestrator>;
	let logger: DeepMocked<Logger>;
	let handler: Z21EventHandler;
	let cvProgrammingService: DeepMocked<CvProgrammingService>;

	beforeEach(async () => {
		broadcast = vi.fn();
		locoManager = Mock<LocoManager>();
		commandStationInfo = Mock<CommandStationInfo>();
		csInfoOrchestrator = Mock<CommandStationInfoOrchestrator>();
		logger = Mock<Logger>();
		cvProgrammingService = Mock<CvProgrammingService>();

		// Clear mocked functions
		resetMocksBeforeEach({
			broadcast,
			locoManager,
			commandStationInfo,
			csInfoOrchestrator,
			logger,
			cvProgrammingService,
			parseZ21Datagram: z21Mocks.parseZ21Datagram,
			datasetsToEvents: z21Mocks.datasetsToEvents
		});

		// Dynamically import the handler module after mocks are configured
		const mod = await import('./z21-event-handler');
		handler = new mod.Z21EventHandler(
			broadcast,
			locoManager as any,
			logger as any,
			commandStationInfo as any,
			csInfoOrchestrator as any,
			cvProgrammingService as any
		);
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
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{
					kind: 'ds.system.state',
					state: new Uint8Array([0x64, 0x00, 0x32, 0x00, 0x4b, 0x00, 0x19, 0x00, 0x98, 0x3a, 0x88, 0x13, 0x03, 0x04, 0x00, 0x00])
				}
			] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
				{
					type: 'event.system.state',
					payload: { centralState: 0x03, centralStateEx: 0x04 }
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
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{
					kind: 'ds.system.state',
					state: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
				}
			] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
				{
					type: 'event.system.state',
					payload: { centralState: 0x00, centralStateEx: 0x00 }
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

	describe('x.bus.version events', () => {
		it('broadcasts system.x.bus.version with xBusVersion string and cmdsId', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			const versionEvent = { type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x02, xbusVersion: 0x30, raw: [] };
			z21Mocks.datasetsToEvents.mockReturnValue([versionEvent] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd2',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setXBusVersion).toHaveBeenCalledWith(versionEvent);
		});

		it('broadcasts with minimum cmdsId value', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
				{ type: 'event.x.bus.version', xBusVersionString: 'V3.0', cmdsId: 0x14, xbusVersion: 0x30, raw: [] }
			] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xd8',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			// Initialize mock before checking
			(commandStationInfo.setHardwareType as vi.Mock).mockClear();

			handler.handleDatagram(payload);

			expect(commandStationInfo.setHardwareType).not.toHaveBeenCalled();
			expect(broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'event.system.hardware.info' }));
		});

		it('calls csInfoOrchestrator poke and ack after processing xBusVersion', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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

	describe('firmware.version events', () => {
		it('broadcasts system.message.firmware.version with major and minor versions', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.firmware.version', major: 0x12, minor: 0x34, raw: [] }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			const versionEvent = { type: 'event.firmware.version', major: 0x25, minor: 0x99, raw: [] };
			z21Mocks.datasetsToEvents.mockReturnValue([versionEvent] as any);

			const payload = {
				raw: Buffer.from([0x00, 0x00, 0x00, 0x00]),
				rawHex: '0xe4',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setFirmwareVersion).toHaveBeenCalledWith(versionEvent);
		});

		it('broadcasts firmware version with minimum values', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.firmware.version', major: 0x00, minor: 0x00, raw: [] }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.firmware.version', major: 0xff, minor: 0xff, raw: [] }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.firmware.version', major: 0x30, minor: 0x06, raw: [] }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.firmware.version', major: 0x12, minor: 0x34, raw: [] }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.firmware.version', major: 0x01, minor: 0x20, raw: [] }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.z21.stopped' }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.turnout.info', addr: 42, state: 'STRAIGHT' }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.turnout.info', addr: 123, state: 'DIVERGING' }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.turnout.info', addr: 16383, state: 'STRAIGHT' }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			const locoInfoEvent = { type: 'event.loco.info', addr: 200, speed: 0.8, dir: 'REV', fns: { 1: true, 5: false } };
			z21Mocks.datasetsToEvents.mockReturnValue([locoInfoEvent] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.loco.info', addr: 50, speed: 0, dir: 'FWD', fns: {} }] as any);

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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus' }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.hwinfo', hwtype: 0x00000204, fwVersionBcd: 0x00000125 }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([
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
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.code', code: 2 }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.z21.code', code: 2, raw: [] }] as any);

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

	describe('unknown and bad frames', () => {
		it('logs unknown frames', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{ kind: 'ds.unknown', header: 0x99, reason: 'unsupported header', payload: Buffer.from([0x01, 0x02]) }
			] as any);

			const payload = {
				raw: Buffer.from([0x05, 0x00, 0x99, 0x00, 0x01]),
				rawHex: '0x05009900',
				from: { address: '192.168.1.10', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(logger.warn).toHaveBeenCalledWith('z21.unknown', {
				scope: 'frame',
				unknownKind: 'unknown',
				from: { address: '192.168.1.10', port: 21105 },
				header: 0x99,
				reason: 'unsupported header',
				payload: [1, 2],
				hex: '0x05009900'
			});
		});

		it('logs bad XOR checksums', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.bad_xor', calc: '0x42', recv: '0x43' }] as any);

			const payload = {
				raw: Buffer.from([0x07, 0x00, 0x40, 0x00, 0x61, 0x01, 0x43]),
				rawHex: '0x07004000610143',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(logger.warn).toHaveBeenCalledWith('z21.unknown', {
				scope: 'frame',
				unknownKind: 'bad_xor',
				from: { address: '127.0.0.1', port: 21105 },
				calc: '0x42',
				recv: '0x43',
				hex: '0x07004000610143'
			});
		});

		it('logs unknown LAN_X events', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus', xBusHeader: 0x99, data: Buffer.from([0x01]) }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.unknown.lan_x' } as any]);

			const payload = {
				raw: Buffer.from([0x06, 0x00, 0x40, 0x00, 0x99, 0x01]),
				rawHex: '0x0600400099',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(logger.warn).toHaveBeenCalledWith(
				'z21.unknown',
				expect.objectContaining({
					scope: 'lan_x',
					unknownKind: 'event.unknown.lan_x'
				})
			);
		});

		it('logs unknown X-Bus events', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus', xBusHeader: 0x88, data: Buffer.from([0x01]) }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.unknown.x.bus', xHeader: 0x88, bytes: [0x01] } as any]);

			const payload = {
				raw: Buffer.from([0x06, 0x00, 0x40, 0x00, 0x88, 0x01]),
				rawHex: '0x0600400088',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(logger.warn).toHaveBeenCalledWith(
				'z21.unknown',
				expect.objectContaining({
					scope: 'x_bus',
					unknownKind: 'event.unknown.x.bus',
					xHeader: 0x88,
					bytes: [0x01]
				})
			);
		});

		it('logs completely unknown event types in default case', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus', xBusHeader: 0x77, data: Buffer.from([]) }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.something.completely.unknown' } as any]);

			const payload = {
				raw: Buffer.from([0x05, 0x00, 0x40, 0x00, 0x77]),
				rawHex: '0x0500400077',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(logger.warn).toHaveBeenCalledWith(
				'z21.unknown',
				expect.objectContaining({
					scope: 'x_bus'
				})
			);
		});
	});

	describe('z21.stopped events', () => {
		it('sets emergency stop and broadcasts system.stop', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus', xBusHeader: 0x81, data: Buffer.from([0x00]) }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.z21.stopped', raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x07, 0x00, 0x40, 0x00, 0x81, 0x00, 0x81]),
				rawHex: '0x07004000810081',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.stop' });
			expect(logger.info).toHaveBeenCalledWith('z21.stopped', expect.objectContaining({ type: 'event.z21.stopped' }));
		});
	});

	describe('cv events', () => {
		it('forwards cv.result to CvProgrammingService', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{ kind: 'ds.x.bus', xBusHeader: 0x64, data: Buffer.from([0x14, 0x00, 0x1c, 0x2a]) }
			] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.cv.result', cv: 29, value: 42, raw: [] }] as any);

			const payload = {
				raw: Buffer.from([0x0a, 0x00, 0x40, 0x00, 0x64, 0x14, 0x00, 0x1c, 0x2a, 0x5a]),
				rawHex: '0x0a00400064...',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(cvProgrammingService.onEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'event.cv.result',
					cv: 29,
					value: 42
				})
			);
		});

		it('forwards cv.nack to CvProgrammingService', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.x.bus', xBusHeader: 0x61, data: Buffer.from([0x13]) }] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.cv.nack', payload: { shortCircuit: false } }] as any);

			const payload = {
				raw: Buffer.from([0x07, 0x00, 0x40, 0x00, 0x61, 0x13, 0x72]),
				rawHex: '0x07004000...',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(cvProgrammingService.onEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'event.cv.nack'
				})
			);
		});
	});

	describe('x.bus.version with hardware detection', () => {
		it('detects Z21_OLD hardware when cmdsId is 0x12', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{ kind: 'ds.x.bus', xBusHeader: 0x63, data: Buffer.from([0x21, 0x12, 0x13]) }
			] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.x.bus.version', xBusVersionString: '1.9', cmdsId: 0x12 } as any]);

			const payload = {
				raw: Buffer.from([0x09, 0x00, 0x40, 0x00, 0x63, 0x21, 0x12, 0x13, 0x73]),
				rawHex: '0x09004000...',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setHardwareType).toHaveBeenCalledWith('Z21_OLD');
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.hardware.info', hardwareType: 'Z21_OLD' });
		});

		it('detects z21_START hardware when cmdsId is 0x13', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{ kind: 'ds.x.bus', xBusHeader: 0x63, data: Buffer.from([0x21, 0x13, 0x13]) }
			] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.x.bus.version', xBusVersionString: '1.9', cmdsId: 0x13 } as any]);

			const payload = {
				raw: Buffer.from([0x09, 0x00, 0x40, 0x00, 0x63, 0x21, 0x13, 0x13, 0x72]),
				rawHex: '0x09004000...',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(commandStationInfo.setHardwareType).toHaveBeenCalledWith('z21_START');
			expect(broadcast).toHaveBeenCalledWith({ type: 'system.message.hardware.info', hardwareType: 'z21_START' });
		});

		it('does not set hardware type for other cmdsId values', () => {
			z21Mocks.parseZ21Datagram.mockReturnValue([
				{ kind: 'ds.x.bus', xBusHeader: 0x63, data: Buffer.from([0x21, 0x14, 0x13]) }
			] as any);
			z21Mocks.datasetsToEvents.mockReturnValue([{ type: 'event.x.bus.version', xBusVersionString: '1.9', cmdsId: 0x14 } as any]);

			const payload = {
				raw: Buffer.from([0x09, 0x00, 0x40, 0x00, 0x63, 0x21, 0x14, 0x13, 0x71]),
				rawHex: '0x09004000...',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			// Should still set xBusVersion and broadcast it
			expect(commandStationInfo.setXBusVersion).toHaveBeenCalled();
			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'system.message.x.bus.version',
					version: '1.9',
					cmdsId: 0x14
				})
			);
		});
	});

	describe('system.state special handling', () => {
		it('handles system.state dataset and derives track status', () => {
			const systemStateBuffer = Buffer.alloc(16);
			systemStateBuffer[0] = 0x21; // centralState with track power on
			systemStateBuffer[1] = 0x00; // centralStateEx

			z21Mocks.parseZ21Datagram.mockReturnValue([{ kind: 'ds.system.state', state: systemStateBuffer }] as any);

			const payload = {
				raw: Buffer.from([0x14, 0x00, 0x84, 0x00, ...systemStateBuffer]),
				rawHex: '0x14008400...',
				from: { address: '127.0.0.1', port: 21105 }
			} as any;

			handler.handleDatagram(payload);

			expect(broadcast).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'system.message.z21.rx',
					datasets: expect.arrayContaining([expect.objectContaining({ kind: 'system.state' })])
				})
			);
		});
	});
});
