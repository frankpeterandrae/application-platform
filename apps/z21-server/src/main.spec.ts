/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';
import path from 'node:path';

import { createConsoleLogger } from '@application-platform/z21-shared';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

let lastUdpInstance: any = undefined;
vi.mock('@application-platform/z21-shared', () => {
	const mockLogger = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		child: vi.fn().mockReturnThis()
	};
	return {
		createConsoleLogger: vi.fn(() => mockLogger)
	};
});
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
		Z21Service: vi.fn().mockImplementation(function (_udp) {
			return {
				sendTrackPower: vi.fn(),
				demoPing: vi.fn(),
				setLocoDrive: vi.fn(),
				getLocoInfo: vi.fn()
			};
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
		WsServer: vi.fn().mockImplementation(function (this: any, _server: any) {
			// constructor-compatible stub; nothing required for tests since AppWsServer is mocked
			this.server = _server;
		})
	};
});
vi.mock('./app-websocket-server', () => {
	return {
		AppWsServer: vi.fn().mockImplementation(function (this: any, _wsAdapter: any) {
			return { onConnection: vi.fn(), broadcast: vi.fn(), sendToClient: vi.fn() };
		})
	};
});
vi.mock('./client-message-handler', () => {
	return {
		ClientMessageHandler: vi.fn().mockImplementation(function (this: any, _locoManager: any, _udp: any, _broadcast: any) {
			return { handleDatagram: vi.fn() };
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
			this.subscribeLocoInfoOnce = vi.fn().mockReturnValue(true);
		}),
		TrackStatusManager: vi.fn().mockImplementation(function (this: any) {
			this.getStatus = vi.fn();
		})
	};
});
vi.mock('./services/z21-service', () => {
	return {
		Z21EventHandler: vi.fn().mockImplementation(function (this: any, _trackStatusManager: any, _broadcast: any) {
			// Provide handleDatagram which `main` invokes when UDP datagrams arrive
			return { handleDatagram: vi.fn() };
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
	let createServerSpy: ReturnType<typeof vi.spyOn>;
	let listenSpy: Mock;
	let consoleSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		listenSpy = vi.fn((port: number, cb?: () => void) => cb && cb());
		createServerSpy = vi.spyOn(http, 'createServer').mockReturnValue({ listen: listenSpy } as any);
		vi.spyOn(path, 'resolve').mockImplementation((...args: any[]) => {
			// Simple mock that handles basic path resolution without duplicating base paths
			if (args.length === 1) return args[0];
			return path.join(...args);
		});
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
			// do nothing
		});
	});

	afterEach(() => {
		createServerSpy?.mockRestore?.();
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
		// Check that logger.info was called with server.started
		const loggerInstance = (createConsoleLogger as Mock).mock.results[0].value;
		expect(loggerInstance.info).toHaveBeenCalledWith('server.started', {
			httpPort: cfg.httpPort,
			host: cfg.z21.host,
			udpPort: cfg.z21.udpPort
		});
	});

	it('wires Z21 datagram handler to dispatch payloads to Z21EventHandler', async () => {
		await import('./main');

		const z21Mock = await vi.importMock('@application-platform/z21');
		const { Z21Udp } = z21Mock as any;
		const { Z21EventHandler } = await import('./services/z21-service');

		const udpInstance = (Z21Udp as Mock).mock.results[0].value;
		const datagramHandler = (udpInstance.on as Mock).mock.calls.find((call) => call[0] === 'datagram')?.[1];
		expect(datagramHandler).toBeDefined();

		const handlerInstance = (Z21EventHandler as Mock).mock.results[0].value;
		const testDatagram = { raw: Buffer.from([0x04, 0x00]), rawHex: '0x01', from: { address: '127.0.0.1', port: 21105 } };
		datagramHandler(testDatagram);

		expect(handlerInstance.handleDatagram).toHaveBeenCalledWith(testDatagram);
	});

	it('broadcasts loco.message.state for all stopped locos on disconnect when safety flag is enabled', async () => {
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

	it('requests loco info on connection when subscribeLocoInfoOnce returns true', async () => {
		await import('./main');

		const { AppWsServer } = await import('./app-websocket-server');
		const z21Mock = await vi.importMock('@application-platform/z21');
		const domainMock = await vi.importMock('@application-platform/domain');
		const { Z21Service } = z21Mock as any;
		const { LocoManager } = domainMock as any;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21Service as Mock).mock.results[0].value;

		// ensure subscribeLocoInfoOnce returns true
		(locoManagerInstance.subscribeLocoInfoOnce as Mock).mockReturnValue(true);

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onSubscribe = onConnectionCalls[2];

		onSubscribe();

		expect(locoManagerInstance.subscribeLocoInfoOnce).toHaveBeenCalledWith(1845);
		expect(z21ServiceInstance.getLocoInfo).toHaveBeenCalledWith(1845);
	});

	it('does not request loco info on connection when subscribeLocoInfoOnce returns false', async () => {
		await import('./main');

		const { AppWsServer } = await import('./app-websocket-server');
		const z21Mock = await vi.importMock('@application-platform/z21');
		const domainMock = await vi.importMock('@application-platform/domain');
		const { Z21Service } = z21Mock as any;
		const { LocoManager } = domainMock as any;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21Service as Mock).mock.results[0].value;

		// ensure subscribeLocoInfoOnce returns false
		(locoManagerInstance.subscribeLocoInfoOnce as Mock).mockReturnValue(false);

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onSubscribe = onConnectionCalls[2];

		onSubscribe();

		expect(locoManagerInstance.subscribeLocoInfoOnce).toHaveBeenCalledWith(1845);
		expect(z21ServiceInstance.getLocoInfo).not.toHaveBeenCalled();
	});
});
