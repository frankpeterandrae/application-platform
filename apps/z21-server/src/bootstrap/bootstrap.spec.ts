/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

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
				getXBusVersion: vi.fn(),
				getFirmwareVersion: vi.fn()
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
				getXBusVersion: vi.fn().mockReturnValue(undefined),
				hasXBusVersion: vi.fn().mockReturnValue(false),
				setXBusVersion: vi.fn(),
				hasFirmwareVersion: vi.fn().mockReturnValue(false),
				getFirmwareVersion: vi.fn().mockReturnValue(undefined),
				setFirmwareVersion: vi.fn()
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

import { LocoManager } from '@application-platform/domain';

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

	it('requests version from Z21 when first client connects and version not cached', () => {
		vi.clearAllMocks();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(z21ServiceInstance.getXBusVersion).toHaveBeenCalled();
		expect(appWsInstance.broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'system.message.x.bus.version' }));
	});

	it('broadcasts cached version when first client connects and version exists', () => {
		vi.clearAllMocks();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;
		const { CommandStationInfo } = domainMock;

		// Configure CommandStationInfo mock to simulate cached version
		const cmdInstance = (CommandStationInfo as Mock).mock.results[0].value;
		(cmdInstance.hasXBusVersion as Mock).mockReturnValue(true);
		(cmdInstance.getXBusVersion as Mock).mockReturnValue({ xBusVersionString: 'V2.3', cmdsId: 5 });

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(z21ServiceInstance.getXBusVersion).not.toHaveBeenCalled();
		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'system.message.x.bus.version',
			version: 'V2.3',
			cmdsId: 5
		});
	});

	it('broadcasts cached version with Unknown version string', () => {
		vi.clearAllMocks();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { CommandStationInfo } = domainMock;

		// Configure CommandStationInfo mock to indicate version exists but fields missing
		const cmdInstance2 = (CommandStationInfo as Mock).mock.results[0].value;
		(cmdInstance2.hasXBusVersion as Mock).mockReturnValue(true);
		(cmdInstance2.getXBusVersion as Mock).mockReturnValue({});

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'system.message.x.bus.version',
			version: 'Unknown',
			cmdsId: 0
		});
	});

	it('requests firmware version from Z21 when first client connects and firmware version not cached', () => {
		vi.clearAllMocks();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(z21ServiceInstance.getFirmwareVersion).toHaveBeenCalled();
		expect(appWsInstance.broadcast).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'system.message.firmware.version' }));
	});

	it('broadcasts cached firmware version when first client connects and firmware version exists', () => {
		vi.clearAllMocks();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;
		const { Z21CommandService } = z21;
		const { CommandStationInfo } = domainMock;

		// Configure CommandStationInfo mock to simulate cached version
		const cmdInstance = (CommandStationInfo as Mock).mock.results[0].value;
		(cmdInstance.hasFirmwareVersion as Mock).mockReturnValue(true);
		(cmdInstance.getFirmwareVersion as Mock).mockReturnValue({ major: 0x25, minor: 0x42 });
		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const z21ServiceInstance = (Z21CommandService as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		onConnect();

		expect(z21ServiceInstance.getFirmwareVersion).not.toHaveBeenCalled();
		expect(appWsInstance.broadcast).toHaveBeenCalledWith({
			type: 'system.message.firmware.version',
			major: 0x25,
			minor: 0x42
		});
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

	it('broadcasts loco.state with estop flag on disconnect when safety is enabled', () => {
		vi.clearAllMocks();

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		// Return a single loco with estop=true for this test
		(locoManagerInstance.stopAll as Mock).mockReturnValue([{ addr: 10, state: { dir: 'fwd', fns: {}, estop: true }, speed: 0 }]);

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

		const bootstrap = new Bootstrap({
			httpPort: 5050,
			z21: { host: '1.2.3.4', udpPort: 21105 },
			safety: { stopAllOnClientDisconnect: true }
		});

		bootstrap.start();

		const { AppWsServer } = appWsMock;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const locoManagerInstance = (LocoManager as Mock).mock.results[0].value;

		// Return no stopped locos for this test
		(locoManagerInstance.stopAll as Mock).mockReturnValue([]);

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

		const { AppWsServer } = appWsMock;
		const { Z21Udp } = z21;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;

		const onConnectionCalls = (appWsInstance.onConnection as Mock).mock.calls[0];
		const onConnect = onConnectionCalls[2];

		const initialCalls = (udpInstance.sendSystemStateGetData as Mock).mock.calls.length;

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

		const { AppWsServer } = appWsMock;
		const { Z21Udp } = z21;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;

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

		const { AppWsServer } = appWsMock;
		const { Z21Udp } = z21;

		const appWsInstance = (AppWsServer as Mock).mock.results[0].value;
		const udpInstance = (Z21Udp as unknown as Mock).mock.results[0].value;

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
});
