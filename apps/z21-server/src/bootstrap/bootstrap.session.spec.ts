/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type http from 'node:http';

import type { CommandStationInfo, LocoManager } from '@application-platform/domain';
import { clearAllMocks, Mock, type DeepMocked } from '@application-platform/shared-node-test';
import { Z21BroadcastFlag, type Z21CommandService, type Z21Udp } from '@application-platform/z21';
import type { Logger } from '@application-platform/z21-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Z21EventHandler } from '../handler/z21-event-handler';
import type { AppWsServer } from '../infra/ws/app-websocket-server';
import type { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';

import { Bootstrap } from './bootstrap';
import type { Providers } from './providers';

describe('Bootstrap session lifecycle', () => {
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

		mockLocoManager.subscribeLocoInfoOnce.mockReturnValue(false);
		mockLocoManager.stopAll.mockReturnValue([{ addr: 1, state: { speed: 0, dir: 'FWD', fns: [], estop: false } } as any]);
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
			logger: mockLogger as any,
			httpServer: mockHttpServer as any,
			commandStationInfo: Mock<CommandStationInfo>() as any,
			wsOnConnection,
			broadcast
		};

		return providers;
	}

	beforeEach(() => {
		providers = makeProviders();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('resets and pokes csInfoOrchestrator when first client connects', () => {
		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];

		// Clear the mocks from the start() call
		clearAllMocks(providers);

		onConnect({});

		expect(providers.csInfoOrchestrator.reset).toHaveBeenCalledTimes(1);
		expect(providers.csInfoOrchestrator.poke).toHaveBeenCalledTimes(1);
		expect(providers.udp.sendSetBroadcastFlags).toHaveBeenCalledWith(Z21BroadcastFlag.Basic);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(1);
	});

	it('resets orchestrator and stops heartbeat when last client disconnects', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, onDisconnect, onConnect] = providers.wsOnConnection!.mock.calls[0];
		onConnect({});

		// Clear specific mock to test heartbeat
		(providers.udp.sendSystemStateGetData as vi.Mock).mockClear();
		vi.advanceTimersByTime(60_000);
		expect(providers.udp.sendSystemStateGetData).toHaveBeenCalledTimes(1);

		onDisconnect({});

		// Clear to verify no more heartbeat calls
		(providers.udp.sendSystemStateGetData as vi.Mock).mockClear();

		expect(providers.csInfoOrchestrator.reset).toHaveBeenCalledTimes(2); // Once on connect, once on disconnect
		expect(providers.udp.sendLogOff).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(120_000);
		expect(providers.udp.sendSystemStateGetData).not.toHaveBeenCalled();
	});

	it('does not reinitialize session on subsequent client connects', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];
		onConnect({});

		// Clear the mocks to verify subsequent connect doesn't reinitialize
		(providers.csInfoOrchestrator.reset as vi.Mock).mockClear();
		(providers.csInfoOrchestrator.poke as vi.Mock).mockClear();
		(providers.udp.sendSetBroadcastFlags as vi.Mock).mockClear();
		(providers.udp.sendSystemStateGetData as vi.Mock).mockClear();

		onConnect({});

		expect(providers.csInfoOrchestrator.reset).not.toHaveBeenCalled();
		expect(providers.csInfoOrchestrator.poke).not.toHaveBeenCalled();
		expect(providers.udp.sendSetBroadcastFlags).not.toHaveBeenCalled();
		expect(providers.udp.sendSystemStateGetData).not.toHaveBeenCalled();
	});

	it('ignores disconnect when no clients were connected', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap(providers);

		bootstrap.start();

		const [, onDisconnect] = providers.wsOnConnection!.mock.calls[0];

		// Clear any calls from start() to ensure clean state
		(providers.csInfoOrchestrator.reset as vi.Mock).mockClear();
		(providers.udp.sendLogOff as vi.Mock).mockClear();

		onDisconnect({});

		expect(providers.csInfoOrchestrator.reset).not.toHaveBeenCalled();
		expect(providers.udp.sendLogOff).not.toHaveBeenCalled();
	});

	it('returns stable ws client id for same object and unique for different objects', () => {
		const bootstrap = new Bootstrap(providers) as any;

		const ws1 = {};
		const ws2 = {};

		const id1a = bootstrap.getWsClientId(ws1);
		const id1b = bootstrap.getWsClientId(ws1);
		const id2 = bootstrap.getWsClientId(ws2);

		expect(id1a).toBe(id1b);
		expect(id1a).not.toBe(id2);
	});

	it('does nothing when deactivating session that is not active', () => {
		const bootstrap = new Bootstrap(providers) as any;

		// Ensure mocks are initialized
		(providers.udp.sendLogOff as vi.Mock).mockClear();
		(providers.csInfoOrchestrator.reset as vi.Mock).mockClear();

		bootstrap.deactivateZ21Session();

		expect(providers.udp.sendLogOff).not.toHaveBeenCalled();
		expect(providers.csInfoOrchestrator.reset).not.toHaveBeenCalled();
	});

	it('stops heartbeat and logoff when stop is called with active session', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap(providers) as any;

		bootstrap.start();
		const [, , onConnect] = providers.wsOnConnection!.mock.calls[0];
		onConnect({});

		bootstrap.stop();

		expect(providers.udp.sendLogOff).toHaveBeenCalledTimes(1);
		(providers.udp.sendSystemStateGetData as vi.Mock).mockClear();

		vi.advanceTimersByTime(120_000);
		expect(providers.udp.sendSystemStateGetData).not.toHaveBeenCalled();
	});

	it('stop succeeds when session never activated', () => {
		const bootstrap = new Bootstrap(providers) as any;

		// Ensure mocks are initialized
		(providers.udp.sendLogOff as vi.Mock).mockClear();

		expect(() => bootstrap.stop()).not.toThrow();
		expect(providers.udp.sendLogOff).not.toHaveBeenCalled();
	});
});
