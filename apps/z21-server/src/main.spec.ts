/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';
import path from 'node:path';

import { vi, type Mock } from 'vitest';

let lastUdpInstance: any = undefined;

vi.mock('@application-platform/z21', async () => {
	const actual = await vi.importActual('@application-platform/z21');
	return {
		...actual,
		Z21Udp: vi.fn().mockImplementation(function () {
			// return a plain object instance (constructor-return) instead of aliasing `this`
			const inst = {
				start: vi.fn(),
				sendGetSerial: vi.fn(),
				sendSetBroadcastFlags: vi.fn(),
				sendSystemStateGetData: vi.fn(),
				on: vi.fn()
			};
			lastUdpInstance = inst;
			return inst;
		}),
		Z21Service: vi.fn().mockImplementation(function (udp) {
			const inst = {
				sendTrackPower: vi.fn(),
				demoPing: vi.fn(),
				setLocoDrive: vi.fn()
			};
			return inst;
		}),
		Z21BroadcastFlag: {
			None: 0x00000000,
			Basic: 0x00000001,
			SystemState: 0x00000100
		}
	};
});
vi.mock('@application-platform/server-utils', () => {
	return {
		createStaticFileServer: vi.fn(function () {
			return vi.fn();
		}),
		WsServer: vi.fn().mockImplementation(function (this: any, server: any) {
			// constructor-compatible stub; nothing required for tests since AppWsServer is mocked
			this.server = server;
		})
	};
});
vi.mock('./app-websocket-server', () => {
	return {
		AppWsServer: vi.fn().mockImplementation(function (this: any, wsAdapter: any) {
			return { onConnection: vi.fn(), broadcast: vi.fn(), sendToClient: vi.fn() };
		})
	};
});
vi.mock('./client-message-handler', () => {
	return {
		ClientMessageHandler: vi.fn().mockImplementation(function (this: any, locoManager: any, udp: any, broadcast: any) {
			return { handle: vi.fn() };
		})
	};
});
vi.mock('@application-platform/domain', () => {
	return {
		LocoManager: vi.fn().mockImplementation(function (this: any) {
			this.stopAll = vi.fn().mockReturnValue([
				{ addr: 3, state: { dir: 'fwd', fns: { 0: true } } },
				{ addr: 7, state: { dir: 'rev', fns: { 2: false } } }
			]);
		}),
		TrackStatusManager: vi.fn().mockImplementation(function (this: any) {
			this.getStatus = vi.fn();
		})
	};
});
vi.mock('./services/z21-service', () => {
	return {
		Z21EventHandler: vi.fn().mockImplementation(function (this: any, trackStatusManager: any, broadcast: any) {
			return { handle: vi.fn() };
		})
	};
});
vi.mock('./infra/config/config', () => {
	return {
		loadConfig: vi
			.fn()
			.mockReturnValue({ httpPort: 5050, z21: { host: '1.2.3.4', udpPort: 21105 }, safety: { stopAllOnClientDisconnect: true } })
	};
});
describe('main bootstrap', () => {
	let createServerSpy: vi.SpyInstance;
	let listenSpy: Mock;
	let consoleSpy: vi.SpyInstance;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		listenSpy = vi.fn((port: number, cb?: () => void) => cb && cb());
		createServerSpy = vi.spyOn(http, 'createServer').mockReturnValue({ listen: listenSpy } as any);
		vi.spyOn(path, 'resolve').mockImplementation((...args: any[]) => args.join('/'));
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
			// do nothing
		});
	});

	afterEach(() => {
		createServerSpy.mockRestore();
		consoleSpy.mockRestore();
	});

	it('starts UDP and performs initial priming requests', async () => {
		await import('./main');

		const udpInstance = lastUdpInstance;

		expect(udpInstance.start).toHaveBeenCalledWith(21105);
		expect(udpInstance.sendGetSerial).toHaveBeenCalled();
		expect(udpInstance.sendSetBroadcastFlags).toHaveBeenCalledWith(0x00000001);
		expect(udpInstance.sendSystemStateGetData).toHaveBeenCalled();
	});

	it('listens on configured HTTP port and logs startup message', async () => {
		const cfgMod = await import('./infra/config/config');
		const cfg = cfgMod.loadConfig();

		await import('./main');

		expect(http.createServer).toHaveBeenCalled();
		expect(listenSpy).toHaveBeenCalledWith(cfg.httpPort, expect.any(Function));
		expect(consoleSpy).toHaveBeenCalledWith(`[server] http://0.0.0.0:${cfg.httpPort} (Z21 ${cfg.z21.host}:${cfg.z21.udpPort})`);
	});

	it('wires Z21 rx handler to forward payloads to Z21EventHandler', async () => {
		await import('./main');

		const z21Mock = await vi.importMock('@application-platform/z21');
		const { Z21Udp } = z21Mock as any;
		const { Z21EventHandler } = await import('./services/z21-service');

		const udpInstance = (Z21Udp as Mock).mock.results[0].value;
		const rxHandler = (udpInstance.on as Mock).mock.calls.find((call) => call[0] === 'rx')?.[1];
		expect(rxHandler).toBeDefined();

		const handlerInstance = (Z21EventHandler as Mock).mock.results[0].value;
		rxHandler({ type: 'datasets' });

		expect(handlerInstance.handle).toHaveBeenCalledWith({ type: 'datasets' });
	});

	it('broadcasts loco.state for all stopped locos on disconnect when safety flag is enabled', async () => {
		await import('./main');

		const { AppWsServer } = await import('./app-websocket-server');
		const domainMock = await vi.importMock('@application-platform/domain');
		const { LocoManager } = domainMock as any;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onDisconnect = onConnectionCalls[1];

		onDisconnect();

		expect(locoManagerInstance.stopAll).toHaveBeenCalled();
		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			addr: 3,
			speed: 0,
			dir: 'fwd',
			fns: { 0: true }
		});
		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			addr: 7,
			speed: 0,
			dir: 'rev',
			fns: { 2: false }
		});
	});

	it('does not broadcast on disconnect when safety flag is disabled', async () => {
		vi.resetModules();
		vi.clearAllMocks();

		vi.doMock('./infra/config/config', () => ({
			loadConfig: vi.fn().mockReturnValue({
				httpPort: 5050,
				z21: { host: '1.2.3.4', udpPort: 21105 },
				safety: { stopAllOnClientDisconnect: false }
			})
		}));

		createServerSpy = vi
			.spyOn(http, 'createServer')
			.mockReturnValue({ listen: vi.fn((_: number, cb?: () => void) => cb && cb()) } as any);
		vi.spyOn(console, 'log').mockImplementation(() => {
			// do nothing
		});

		await import('./main');

		const { AppWsServer } = await import('./app-websocket-server');
		const domainMock2 = await vi.importMock('@application-platform/domain');
		const { LocoManager } = domainMock2 as any;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onDisconnect = onConnectionCalls[1];

		onDisconnect();

		expect(locoManagerInstance.stopAll).not.toHaveBeenCalled();
		expect(appWsInstance.broadcast).not.toHaveBeenCalled();
	});
});
