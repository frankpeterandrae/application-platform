/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommandStationInfo, LocoManager } from '@application-platform/domain';
import { Z21CommandService, Z21Udp } from '@application-platform/z21';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { Z21EventHandler } from '../handler/z21-event-handler';
import { loadConfig } from '../infra/config/config';
import { AppWsServer } from '../infra/ws/app-websocket-server';
import { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';

import { createProviders } from './providers';

vi.mock('node:http', () => ({
	default: {
		createServer: vi.fn(() => ({ listen: vi.fn(), close: vi.fn() }))
	},
	createServer: vi.fn(() => ({ listen: vi.fn(), close: vi.fn() }))
}));

vi.mock('@application-platform/z21-shared', () => ({
	createConsoleLogger: vi.fn(() => {
		const logger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn() } as any;
		logger.child.mockImplementation(() => logger);
		return logger;
	})
}));

vi.mock('@application-platform/z21', () => {
	class Z21UdpMock {
		public start = vi.fn();
		public stop = vi.fn();
		public on = vi.fn();

		constructor(..._args: any[]) {
			// args captured by vi.fn wrapper
		}
	}
	class Z21CommandServiceMock {
		constructor(..._args: any[]) {
			// args captured by vi.fn wrapper
		}
	}
	return {
		__esModule: true,
		Z21Udp: vi.fn(Z21UdpMock),
		Z21CommandService: vi.fn(Z21CommandServiceMock)
	};
});

vi.mock('@application-platform/domain', () => {
	class CommandStationInfoMock {}
	class LocoManagerMock {}
	class TrackStatusManagerMock {}
	return {
		__esModule: true,
		CommandStationInfo: vi.fn().mockImplementation(function (...args: any[]) {
			return Object.assign(new CommandStationInfoMock(), { __args: args });
		}),
		LocoManager: vi.fn().mockImplementation(function (...args: any[]) {
			return Object.assign(new LocoManagerMock(), { __args: args });
		}),
		TrackStatusManager: vi.fn().mockImplementation(function (...args: any[]) {
			return Object.assign(new TrackStatusManagerMock(), { __args: args });
		})
	};
});

vi.mock('../services/command-station-info-orchestrator', () => ({
	CommandStationInfoOrchestrator: vi.fn().mockImplementation(function () {
		return { reset: vi.fn(), poke: vi.fn(), ack: vi.fn() };
	})
}));

vi.mock('../infra/ws/app-websocket-server', () => ({
	AppWsServer: vi.fn().mockImplementation(function () {
		return { broadcast: vi.fn(), onConnection: vi.fn(), close: vi.fn() };
	})
}));

vi.mock('@application-platform/server-utils', () => ({
	createStaticFileServer: vi.fn(() => vi.fn()),
	WsServer: vi.fn().mockImplementation(function () {
		return {};
	})
}));

vi.mock('../infra/config/config', async () => {
	const actual = await vi.importActual('../infra/config/config');
	return {
		loadConfig: vi.fn(() => ({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		})),
		['ServerConfig']: (actual as any)['ServerConfig']
	};
});

vi.mock('../handler/z21-event-handler', () => ({
	Z21EventHandler: vi.fn().mockImplementation(function (broadcast) {
		return { handleDatagram: vi.fn(), __broadcast: broadcast };
	})
}));

describe('createProviders', () => {
	const cfg = {
		httpPort: 6060,
		z21: { host: '2.3.4.5', udpPort: 21106, listenPort: 30000 },
		safety: { stopAllOnClientDisconnect: true }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates providers using supplied config without calling loadConfig', () => {
		const providers = createProviders(cfg as any);

		expect(loadConfig).not.toHaveBeenCalled();
		expect(providers.cfg).toBe(cfg as any);
	});

	it('constructs UDP, ws, command service, orchestrator, locoManager, and event handler', () => {
		createProviders(cfg as any);

		expect(Z21Udp).toHaveBeenCalledWith(cfg.z21.host, cfg.z21.udpPort, expect.any(Object));
		expect(AppWsServer).toHaveBeenCalled();
		expect(Z21CommandService).toHaveBeenCalled();
		expect(CommandStationInfo).toHaveBeenCalled();
		expect(LocoManager).toHaveBeenCalled();
		expect(CommandStationInfoOrchestrator).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
		expect(Z21EventHandler).toHaveBeenCalledWith(
			expect.any(Function),
			expect.any(Object),
			expect.any(Object),
			expect.any(Object),
			expect.any(Object)
		);
	});

	it('broadcast delegates to wsServer.broadcast', () => {
		const wsInstance = { broadcast: vi.fn(), onConnection: vi.fn(), close: vi.fn() };
		(AppWsServer as Mock).mockImplementation(function () {
			return wsInstance;
		});

		const providers = createProviders(cfg as any);

		const msg = { type: 'session.ready' } as any;
		(providers.z21EventHandler as any).__broadcast(msg);

		expect(wsInstance.broadcast).toHaveBeenCalledWith(msg);
	});
});
