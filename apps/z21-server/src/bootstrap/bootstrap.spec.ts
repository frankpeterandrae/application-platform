/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';

// import module under test after mocks so they get applied

import { CommandStationInfo, LocoManager } from '@application-platform/domain';
import { LocoDrive } from '@application-platform/protocol';
import { Mock, type DeepMocked } from '@application-platform/shared-node-test';
import { Z21CommandService, Z21Udp } from '@application-platform/z21';
import { Logger } from '@application-platform/z21-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Z21EventHandler } from '../handler/z21-event-handler';
import { AppWsServer } from '../infra/ws/app-websocket-server';
import { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';
import type { CvProgrammingService } from '../services/cv-programming-service';

import { Bootstrap } from './bootstrap';
import { Providers } from './providers';

describe('Bootstrap', () => {
	let providers: DeepMocked<Providers> & { wsOnConnection: vi.Mock; broadcast: vi.Mock };

	function makeProviders(): DeepMocked<Providers> & { wsOnConnection: vi.Mock; broadcast: vi.Mock } {
		const wsOnConnection = vi.fn();
		const broadcast = vi.fn();
		const wsServerClose = vi.fn((cb?: () => void) => {
			cb?.();
			return {} as any;
		});
		const mockUdp = Mock<Z21Udp>();
		const mockWsServer = Mock<AppWsServer>();
		const mockZ21CommandService = Mock<Z21CommandService>();
		const mockZ21EventHandler = Mock<Z21EventHandler>();
		const mockLocoManager = Mock<LocoManager>();
		const mockCsInfoOrchestrator = Mock<CommandStationInfoOrchestrator>();
		const mockLogger = Mock<Logger>();
		const mockHttpServer = Mock<http.Server>();

		mockLocoManager.subscribeLocoInfoOnce.mockReturnValue(true);
		mockLocoManager.stopAll.mockReturnValue([
			{ addr: 3, state: { speed: 0, dir: 'FWD', fns: { 0: true }, estop: false } },
			{ addr: 7, state: { speed: 0, dir: 'REV', fns: { 2: false }, estop: false } }
		]);
		mockLogger.child.mockReturnThis();
		mockHttpServer.listen.mockImplementation((_p: number, cb?: () => void) => {
			cb?.();
			return mockHttpServer as unknown as http.Server;
		});
		mockHttpServer.close.mockImplementation((cb?: () => void) => {
			cb?.();
			return mockHttpServer as unknown as http.Server;
		});

		const providers: DeepMocked<Providers> & { wsOnConnection: vi.Mock; broadcast: vi.Mock } = {
			cfg: { httpPort: 5050, z21: { host: '1.2.3.4', udpPort: 21105 }, safety: { stopAllOnClientDisconnect: true } } as any,
			logger: mockLogger as any,
			httpServer: mockHttpServer as any,
			udp: mockUdp as any,
			wsServer: {
				...mockWsServer,
				onConnection: wsOnConnection,
				broadcast,
				close: wsServerClose
			} as any,
			z21CommandService: mockZ21CommandService as any,
			z21EventHandler: mockZ21EventHandler as any,
			locoManager: mockLocoManager as any,
			csInfoOrchestrator: mockCsInfoOrchestrator as any,
			commandStationInfo: Mock<CommandStationInfo>() as any,
			wsOnConnection,
			broadcast,
			cvProgrammingService: Mock<CvProgrammingService>() as any
		};

		return providers;
	}

	beforeEach(() => {
		providers = makeProviders();
	});

	// Helper function to setup mocked CommandStationInfo and real orchestrator for testing
	function setupMockedOrchestrator(hasXBusVersion: boolean, hasFirmwareVersion: boolean): void {
		const mockCommandStationInfo = Mock<CommandStationInfo>();
		mockCommandStationInfo.hasXBusVersion.mockReturnValue(hasXBusVersion);
		mockCommandStationInfo.hasFirmwareVersion.mockReturnValue(hasFirmwareVersion);

		if (hasFirmwareVersion) {
			mockCommandStationInfo.getFirmwareVersion.mockReturnValue({ major: 0x01, minor: 0x12 } as any);
		}

		// Create real orchestrator with mocked dependencies to test actual poke() behavior
		const realOrchestrator = new CommandStationInfoOrchestrator(mockCommandStationInfo as any, providers.z21CommandService as any);

		providers.commandStationInfo = mockCommandStationInfo as any;
		providers.csInfoOrchestrator = realOrchestrator as any;
	}

	it('starts UDP and performs initial priming requests', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		expect(providers.udp.start).toHaveBeenCalledWith(21105);
	});

	it('listens on configured HTTP port', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		expect(providers.httpServer.listen).toHaveBeenCalledWith(providers.cfg.httpPort, expect.any(Function));
	});

	it('wires Z21 datagram handler to dispatch payloads to Z21EventHandler', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const datagramHandler = (providers.udp.on as vi.Mock).mock.calls.find((call) => call[0] === 'datagram')?.[1];
		expect(datagramHandler).toBeDefined();

		const testDatagram = { raw: Buffer.from([0x04, 0x00]), rawHex: '0x01', from: { address: '127.0.0.1', port: 21105 } };
		datagramHandler(testDatagram);

		expect(providers.z21EventHandler.handleDatagram).toHaveBeenCalledWith(testDatagram);
	});

	it('broadcasts loco.message.state for all stopped locos on disconnect when safety flag is enabled', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, onDisconnect] = providers.wsOnConnection!.mock.calls[0];

		onDisconnect();

		expect(providers.locoManager.stopAll).toHaveBeenCalled();
		expect(providers.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			payload: {
				addr: 3,
				speed: 0,
				dir: 'FWD',
				fns: { 0: true },
				estop: false
			}
		});
		expect(providers.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			payload: {
				addr: 7,
				speed: 0,
				dir: 'REV',
				fns: { 2: false },
				estop: false
			}
		});
	});

	it('does not broadcast on disconnect when safety flag is disabled', () => {
		// Create providers with safety flag disabled
		const disabledSafetyProviders = makeProviders();
		disabledSafetyProviders.cfg.safety.stopAllOnClientDisconnect = false;

		const bootstrap = new Bootstrap(disabledSafetyProviders);

		bootstrap.start();

		const [, onDisconnect] = disabledSafetyProviders.wsOnConnection!.mock.calls[0];

		onDisconnect();

		expect(disabledSafetyProviders.locoManager.stopAll).not.toHaveBeenCalled();
		expect(disabledSafetyProviders.broadcast).not.toHaveBeenCalled();
	});

	it('requests loco info on connection when subscribeLocoInfoOnce returns true and dev config present', () => {
		providers.locoManager.subscribeLocoInfoOnce.mockReturnValue(true);
		providers.cfg.dev = { subscribeLocoAddr: 1845 };

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		onConnect({});

		expect(providers.locoManager.subscribeLocoInfoOnce).toHaveBeenCalledWith(1845);
		expect(providers.z21CommandService.getLocoInfo).toHaveBeenCalledWith(1845);
	});

	it('does not request loco info on connection when subscribeLocoInfoOnce returns false', () => {
		providers.locoManager.subscribeLocoInfoOnce.mockReturnValue(false);
		providers.cfg.dev = { subscribeLocoAddr: 1845 };
		(providers.z21CommandService.getLocoInfo as vi.Mock).mockClear();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		onConnect({});

		expect(providers.locoManager.subscribeLocoInfoOnce).toHaveBeenCalledWith(1845);
		expect(providers.z21CommandService.getLocoInfo).not.toHaveBeenCalled();
	});

	it('does not request loco info on connection when dev config is missing', () => {
		(providers.locoManager.subscribeLocoInfoOnce as vi.Mock).mockClear();
		(providers.z21CommandService.getLocoInfo as vi.Mock).mockClear();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		onConnect({});

		expect(providers.locoManager.subscribeLocoInfoOnce).not.toHaveBeenCalled();
		expect(providers.z21CommandService.getLocoInfo).not.toHaveBeenCalled();
	});

	it('requests version from Z21 when first client connects and version not cached', () => {
		setupMockedOrchestrator(false, true);

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		// Clear mocks from start() to focus on onConnect behavior
		(providers.z21CommandService.getXBusVersion as vi.Mock).mockClear();

		onConnect({});

		expect(providers.z21CommandService.getXBusVersion).toHaveBeenCalled();
		expect(providers.broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'system.message.x.bus.version' }));
	});

	it('requests firmware version from Z21 when first client connects and firmware version not cached', () => {
		setupMockedOrchestrator(false, false);

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		// Clear mocks from start() to focus on onConnect behavior
		(providers.z21CommandService.getFirmwareVersion as vi.Mock).mockClear();

		onConnect({});

		expect(providers.z21CommandService.getFirmwareVersion).toHaveBeenCalled();
		expect(providers.broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'system.message.firmware.version' }));
	});

	it('uses custom listenPort from config when provided', () => {
		providers.cfg.z21.listenPort = 8080;

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		expect(providers.udp.start).toHaveBeenCalledWith(8080);
	});

	it('wires client message handler to process incoming WS messages', () => {
		// Mock locoManager.setSpeed to return a valid state
		providers.locoManager.setSpeed.mockReturnValue({ speed: 0.5, dir: 'FWD', fns: {}, estop: false });

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [onMessage] = providers.wsOnConnection!.mock.calls[0];

		const testMessage = { type: 'loco.command.drive', payload: { addr: 5, speed: 0.5, dir: 'FWD' } } as LocoDrive;
		onMessage(testMessage);

		// The handler should process the message through the locoManager
		expect(providers.locoManager.setSpeed).toHaveBeenCalledWith(5, 0.5, 'FWD');
	});

	it('broadcasts loco.message.state with estop flag on disconnect when safety is enabled', () => {
		providers.locoManager.stopAll.mockReturnValue([{ addr: 10, state: { speed: 0, dir: 'FWD', fns: {}, estop: true } }]);

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, onDisconnect] = providers.wsOnConnection!.mock.calls[0];
		providers.broadcast.mockClear();

		onDisconnect();

		expect(providers.locoManager.stopAll).toHaveBeenCalled();
		expect(providers.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			payload: {
				addr: 10,
				speed: 0,
				dir: 'FWD',
				fns: {},
				estop: true
			}
		});
	});

	it('does not broadcast when no locos are stopped on disconnect', () => {
		providers.locoManager.stopAll.mockReturnValue([]);

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, onDisconnect] = providers.wsOnConnection!.mock.calls[0];

		onDisconnect();

		expect(providers.locoManager.stopAll).toHaveBeenCalled();
		expect(providers.broadcast).not.toHaveBeenCalled();
	});

	it('stops UDP, WebSocket, and HTTP servers on stop', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		bootstrap.stop();

		expect(providers.udp.stop).toHaveBeenCalled();
		expect(providers.wsServer.close).toHaveBeenCalled();
		expect(providers.httpServer.close).toHaveBeenCalled();
	});

	it('handles errors gracefully when stopping servers', () => {
		providers.udp.stop.mockImplementation(() => {
			throw new Error('UDP stop error');
		});
		(providers.wsServer.close as vi.Mock).mockImplementation(() => {
			throw new Error('WS close error');
		});
		providers.httpServer.close.mockImplementation(() => {
			throw new Error('HTTP close error');
		});

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		expect(() => bootstrap.stop()).not.toThrow();
	});

	it('returns bootstrap instance from start for chaining', () => {
		const bootstrap = new Bootstrap(providers);

		const result = bootstrap.start();

		expect(result).toBe(bootstrap);
	});

	it('activates Z21 session on first client and starts heartbeat', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		const initialCalls = (providers.udp.sendSystemStateGetData as vi.Mock).mock.calls.length;

		onConnect({});

		expect(providers.udp.sendSetBroadcastFlags).toHaveBeenCalledWith(0x00000001);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(initialCalls + 1);

		vi.advanceTimersByTime(60_000);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(initialCalls + 2);

		vi.useRealTimers();
	});

	it('does not reactivate Z21 session on subsequent connections', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		onConnect({});
		onConnect({});

		expect(providers.udp.sendSetBroadcastFlags).toHaveBeenCalledTimes(1);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(1);
	});

	it('deactivates Z21 session and heartbeat when last client disconnects', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, onDisconnect, onConnect] = providers.wsOnConnection!.mock.calls[0];
		onConnect({});

		const callsBeforeAdvance = (providers.udp.sendSystemStateGetData as vi.Mock).mock.calls.length;

		vi.advanceTimersByTime(60_000);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(callsBeforeAdvance + 1);

		onDisconnect({});

		expect(providers.udp.sendLogOff).toHaveBeenCalledTimes(1);

		const callsAfterDisconnect = (providers.udp.sendSystemStateGetData as vi.Mock).mock.calls.length;
		vi.advanceTimersByTime(120_000);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(callsAfterDisconnect);

		vi.useRealTimers();
	});
});
