/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import http from 'node:http';

vi.mock('@application-platform/z21', () => {
	return {
		Z21Udp: vi.fn().mockImplementation(function () {
			return {
				start: vi.fn(),
				stop: vi.fn(),
				sendGetSerial: vi.fn(),
				sendSetBroadcastFlags: vi.fn(),
				sendSystemStateGetData: vi.fn(),
				sendLogOff: vi.fn(),
				on: vi.fn()
			};
		}),
		Z21CommandService: vi.fn().mockImplementation(function (_udp: any) {
			return {
				sendTrackPower: vi.fn(),
				demoPing: vi.fn(),
				setLocoDrive: vi.fn(),
				getLocoInfo: vi.fn(),
				getVersion: vi.fn()
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
		WsServer: vi.fn().mockImplementation(function () {
			return {
				onConnection: vi.fn(),
				send: vi.fn(),
				broadcast: vi.fn(),
				close: vi.fn()
			};
		})
	};
});

vi.mock('../infra/ws/app-websocket-server', () => {
	return {
		AppWsServer: vi.fn().mockImplementation(function () {
			return {
				onConnection: vi.fn(),
				broadcast: vi.fn(),
				sendToClient: vi.fn(),
				close: vi.fn()
			};
		})
	};
});

vi.mock('../handler/client-message-handler', () => {
	return {
		ClientMessageHandler: vi.fn().mockImplementation(function (_locoManager: any, _udp: any, _broadcast: any) {
			return { handle: vi.fn() };
		})
	};
});

vi.mock('@application-platform/domain', () => {
	return {
		LocoManager: vi.fn().mockImplementation(function () {
			return {
				stopAll: vi.fn().mockReturnValue([
					{ addr: 3, state: { dir: 'fwd', fns: { 0: true }, estop: false } },
					{ addr: 7, state: { dir: 'rev', fns: { 2: false }, estop: false } }
				]),
				subscribeLocoInfoOnce: vi.fn().mockReturnValue(true)
			};
		}),
		TrackStatusManager: vi.fn().mockImplementation(function () {
			return { getStatus: vi.fn() };
		}),
		CommandStationInfo: vi.fn().mockImplementation(function () {
			return {
				getVersion: vi.fn().mockReturnValue({ model: 'Z21', firmwareVersion: '2.0.0' }),
				hasVersion: vi.fn().mockReturnValue(true)
			};
		})
	};
});

vi.mock('../handler/z21-event-handler', () => {
	return {
		Z21EventHandler: vi.fn().mockImplementation(function (_trackStatusManager: any, _broadcast: any) {
			return { handleDatagram: vi.fn() };
		})
	};
});

vi.mock('@application-platform/z21-shared', () => ({
	createConsoleLogger: vi.fn(() => ({
		info: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		child: vi.fn(function (this: any) {
			return this;
		})
	}))
}));

// import module under test after mocks so they get applied
import * as domainMock from '@application-platform/domain';
import * as z21 from '@application-platform/z21';

import * as clientMsgMock from '../handler/client-message-handler';
import * as z21EventMock from '../handler/z21-event-handler';
import * as appWsMock from '../infra/ws/app-websocket-server';

import { Bootstrap } from './bootstrap';

describe('Bootstrap', () => {
	let createServerSpy: any;
	let listenSpy: Mock;
	let closeSpy: Mock;

	beforeEach(() => {
		vi.clearAllMocks();
		listenSpy = vi.fn((port: number, cb?: () => void) => cb && cb());
		closeSpy = vi.fn();
		createServerSpy = vi.spyOn(http, 'createServer').mockReturnValue({ listen: listenSpy, close: closeSpy, on: vi.fn() } as any);
	});

	afterEach(() => {
		createServerSpy.mockRestore();
	});

	it('starts UDP and performs initial priming requests', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;

		expect(udpInstance.start).toHaveBeenCalledWith(21105);
	});

	it('listens on configured HTTP port', () => {
		const cfg = {
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		};

		const bootstrap = new Bootstrap(cfg);
		bootstrap.start();

		expect(http.createServer).toHaveBeenCalled();
		expect(listenSpy).toHaveBeenCalledWith(cfg.httpPort, expect.any(Function));
	});

	it('wires Z21 datagram handler to dispatch payloads to Z21EventHandler', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const { Z21EventHandler } = z21EventMock;

		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;
		const datagramHandler = (udpInstance.on as Mock).mock.calls.find((call) => call[0] === 'datagram')?.[1];
		expect(datagramHandler).toBeDefined();

		const handlerInstance = (Z21EventHandler as Mock).mock.results[0].value;
		const testDatagram = { raw: Buffer.from([0x04, 0x00]), rawHex: '0x01', from: { address: '127.0.0.1', port: 21105 } };
		datagramHandler(testDatagram);

		expect(handlerInstance.handleDatagram).toHaveBeenCalledWith(testDatagram);
	});

	it('broadcasts loco.message.state for all stopped locos on disconnect when safety flag is enabled', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { LocoManager } = domainMock;

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
			fns: { 0: true },
			estop: false
		});
		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			addr: 7,
			speed: 0,
			dir: 'rev',
			fns: { 2: false },
			estop: false
		});
	});

	it('does not broadcast on disconnect when safety flag is disabled', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: false }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { LocoManager } = domainMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onDisconnect = onConnectionCalls[1];

		onDisconnect();

		expect(locoManagerInstance.stopAll).not.toHaveBeenCalled();
		expect(appWsInstance.broadcast).not.toHaveBeenCalled();
	});

	it('requests loco info on connection when subscribeLocoInfoOnce returns true and dev config present', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true },
			dev: { subscribeLocoAddr: 1845 }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;
		const { LocoManager } = domainMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		(locoManagerInstance.subscribeLocoInfoOnce as Mock).mockReturnValue(true);

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(locoManagerInstance.subscribeLocoInfoOnce).toHaveBeenCalledWith(1845);
		expect(z21ServiceInstance.getLocoInfo).toHaveBeenCalledWith(1845);
	});

	it('does not request loco info on connection when subscribeLocoInfoOnce returns false', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true },
			dev: { subscribeLocoAddr: 1845 }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;
		const { LocoManager } = domainMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		(locoManagerInstance.subscribeLocoInfoOnce as Mock).mockReturnValue(false);

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(locoManagerInstance.subscribeLocoInfoOnce).toHaveBeenCalledWith(1845);
		expect(z21ServiceInstance.getLocoInfo).not.toHaveBeenCalled();
	});

	it('does not request loco info on connection when dev config is missing', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;
		const { LocoManager } = domainMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(locoManagerInstance.subscribeLocoInfoOnce).not.toHaveBeenCalled();
		expect(z21ServiceInstance.getLocoInfo).not.toHaveBeenCalled();
	});

	it('does not request loco info on connection when subscribeLocoAddr is undefined', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true },
			dev: {} as any
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;
		const { LocoManager } = domainMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(locoManagerInstance.subscribeLocoInfoOnce).not.toHaveBeenCalled();
		expect(z21ServiceInstance.getLocoInfo).not.toHaveBeenCalled();
	});

	it('uses custom listenPort from config when provided', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105, listenPort: 8080 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;

		expect(udpInstance.start).toHaveBeenCalledWith(8080);
	});

	it('wires client message handler to process incoming WS messages', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { ClientMessageHandler } = clientMsgMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const handlerInstance = (ClientMessageHandler as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onMessage = onConnectionCalls[0];

		const testMessage = { type: 'loco.drive', addr: 5, speed: 0.5, dir: 'fwd' };
		onMessage(testMessage);

		expect(handlerInstance.handle).toHaveBeenCalledWith(testMessage);
	});

	it('broadcasts loco.message.state with estop flag on disconnect when safety is enabled', () => {
		vi.clearAllMocks();

		const { LocoManager } = domainMock;
		(LocoManager as Mock).mockImplementation(function () {
			return {
				stopAll: vi.fn().mockReturnValue([{ addr: 10, state: { dir: 'fwd', fns: {}, estop: true } }]),
				subscribeLocoInfoOnce: vi.fn()
			};
		});

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onDisconnect = onConnectionCalls[1];

		onDisconnect();

		expect(locoManagerInstance.stopAll).toHaveBeenCalled();
		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'loco.message.state',
			addr: 10,
			speed: 0,
			dir: 'fwd',
			fns: {},
			estop: true
		});
	});

	it('does not broadcast when no locos are stopped on disconnect', () => {
		vi.clearAllMocks();

		const { LocoManager } = domainMock;
		(LocoManager as Mock).mockImplementation(function () {
			return {
				stopAll: vi.fn().mockReturnValue([]),
				subscribeLocoInfoOnce: vi.fn()
			};
		});

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onDisconnect = onConnectionCalls[1];

		onDisconnect();

		expect(locoManagerInstance.stopAll).toHaveBeenCalled();
		expect(appWsInstance.broadcast).not.toHaveBeenCalled();
	});

	it('stops UDP, WebSocket, and HTTP servers on stop', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const { AppWsServer } = appWsMock;

		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;
		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;

		bootstrap.stop();

		expect(udpInstance.stop).toHaveBeenCalled();
		expect(appWsInstance.close).toHaveBeenCalled();
		expect(closeSpy).toHaveBeenCalled();
	});

	it('handles errors gracefully when stopping servers', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const { AppWsServer } = appWsMock;

		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;
		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;

		(udpInstance.stop as Mock).mockImplementation(() => {
			throw new Error('UDP stop error');
		});
		(appWsInstance.close as Mock).mockImplementation(() => {
			throw new Error('WS close error');
		});
		closeSpy.mockImplementation(() => {
			throw new Error('HTTP close error');
		});

		expect(() => bootstrap.stop()).not.toThrow();
	});

	it('returns bootstrap instance from start for chaining', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		const result = bootstrap.start();

		expect(result).toBe(bootstrap);
	});
	it('activates Z21 session on first client and starts heartbeat', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const { AppWsServer } = appWsMock;

		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;
		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;

		const initialCalls = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(udpInstance.sendSetBroadcastFlags).toHaveBeenCalledWith(0x00000001);
		expect(udpInstance.sendSystemStateGetData).toHaveBeenCalledTimes(initialCalls + 1);

		vi.advanceTimersByTime(60_000);
		expect(udpInstance.sendSystemStateGetData).toHaveBeenCalledTimes(initialCalls + 2);

		vi.useRealTimers();
	});

	it('does not reactivate Z21 session on subsequent connections', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const { AppWsServer } = appWsMock;

		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;
		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();
		onConnect();

		expect(udpInstance.sendSetBroadcastFlags).toHaveBeenCalledTimes(1);
		expect(udpInstance.sendSystemStateGetData).toHaveBeenCalledTimes(1);
	});

	it('deactivates Z21 session and heartbeat when last client disconnects', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { Z21Udp } = z21;
		const { AppWsServer } = appWsMock;

		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;
		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;

		const initialCalls = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];
		const onDisconnect = onConnectionCalls[1];

		onConnect();

		const callsBeforeAdvance = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;

		vi.advanceTimersByTime(60_000);
		expect(udpInstance.sendSystemStateGetData).toHaveBeenCalledTimes(callsBeforeAdvance + 1);

		onDisconnect();

		expect(udpInstance.sendLogOff).toHaveBeenCalledTimes(1);

		const callsAfterDisconnect = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;
		vi.advanceTimersByTime(120_000);
		expect(udpInstance.sendSystemStateGetData).toHaveBeenCalledTimes(callsAfterDisconnect);

		vi.useRealTimers();
	});

	it('assigns and reuses WebSocket client ids via getWsClientId', () => {
		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		const ws1 = {};
		const ws2 = {};

		const id1 = (bootstrap as any).getWsClientId(ws1);
		const id1again = (bootstrap as any).getWsClientId(ws1);
		const id2 = (bootstrap as any).getWsClientId(ws2);

		expect(id1).toBeGreaterThan(0);
		expect(id1again).toBe(id1);
		expect(id2).toBeGreaterThan(0);
		expect(id2).not.toBe(id1);
	});

	it('startZ21Heartbeat/stopZ21Heartbeat schedule and cancel periodic sendSystemStateGetData', () => {
		vi.useFakeTimers();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		const { Z21Udp } = z21;
		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value as { sendSystemStateGetData: Mock };

		const initialCalls = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;

		// start heartbeat directly (private)
		(bootstrap as any).startZ21Heartbeat();

		// advance by one interval (60_000 ms)
		vi.advanceTimersByTime(60_000);

		expect((udpInstance.sendSystemStateGetData as Mock).mock.calls.length).toBeGreaterThan(initialCalls);

		// stop heartbeat and verify no further calls after more time passes
		(bootstrap as any).stopZ21Heartbeat();
		const callsAfterStop = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;

		vi.advanceTimersByTime(120_000);

		expect((udpInstance.sendSystemStateGetData as Mock).mock.calls.length).toBe(callsAfterStop);

		vi.useRealTimers();
	});
});
