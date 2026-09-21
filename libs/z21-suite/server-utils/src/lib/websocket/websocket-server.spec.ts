/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type * as http from 'node:http';

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { WebSocket, WebSocketServer, type RawData, type WebSocket as WsWebSocket } from 'ws';

import { WsServer } from './websocket-server';
import type { AliveWebSocket } from './websocket-server-types';

vi.mock('ws', () => {
	const WebSocketServer = vi.fn(function (this: {
		clients: Set<WsWebSocket>;
		on: ReturnType<typeof vi.fn>;
		close: ReturnType<typeof vi.fn>;
	}) {
		this.clients = new Set();
		this.on = vi.fn();
		this.close = vi.fn();
	});

	return {
		WebSocket: {
			OPEN: 1,
			CLOSED: 3
		},
		WebSocketServer
	};
});

type MockWebSocket = AliveWebSocket & {
	send: Mock;
	on: Mock;
	ping: Mock;
	terminate: Mock;
};

type MockWebSocketServer = {
	clients: Set<WsWebSocket>;
	on: Mock;
	close: Mock;
};

describe('WsServer', () => {
	let wsServer: WsServer;
	let wssInstance: MockWebSocketServer;

	function createServer(): void {
		wsServer = new WsServer({} as http.Server);

		wssInstance = (WebSocketServer as unknown as Mock).mock.instances[0] as MockWebSocketServer;
	}

	function makeWebSocket(readyState = WebSocket.OPEN): MockWebSocket {
		return {
			readyState,
			isAlive: true,
			send: vi.fn(),
			on: vi.fn(),
			ping: vi.fn(),
			terminate: vi.fn()
		} as unknown as MockWebSocket;
	}

	function getConnectionHandler(): (ws: WsWebSocket) => void {
		const call = wssInstance.on.mock.calls.find(([event]) => event === 'connection');

		expect(call).toBeDefined();

		return call?.[1] as (ws: WsWebSocket) => void;
	}

	function getSocketHandler<T>(ws: MockWebSocket, event: string): T {
		const call = ws.on.mock.calls.find(([registeredEvent]) => registeredEvent === event);

		expect(call).toBeDefined();

		return call?.[1] as T;
	}

	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		delete process.env['WS_HEARTBEAT_MS'];

		createServer();
	});

	afterEach(() => {
		wsServer.close();
		vi.useRealTimers();
		delete process.env['WS_HEARTBEAT_MS'];
	});

	describe('connection handling', () => {
		it('initializes heartbeat state and registers socket handlers', () => {
			const onMessage = vi.fn();
			const onDisconnect = vi.fn();
			const onConnect = vi.fn();

			wsServer.onConnection(onMessage, onDisconnect, onConnect);

			const ws = makeWebSocket();
			getConnectionHandler()(ws);

			expect(ws.isAlive).toBe(true);
			expect(ws.on).toHaveBeenCalledWith('pong', expect.any(Function));
			expect(ws.on).toHaveBeenCalledWith('message', expect.any(Function));
			expect(ws.on).toHaveBeenCalledWith('close', expect.any(Function));
			expect(onConnect).toHaveBeenCalledWith(ws);
		});

		it('invokes the disconnect handler when the connection closes', () => {
			const onDisconnect = vi.fn();

			wsServer.onConnection(vi.fn(), onDisconnect);

			const ws = makeWebSocket();
			getConnectionHandler()(ws);

			const closeHandler = getSocketHandler<() => void>(ws, 'close');

			closeHandler();

			expect(onDisconnect).toHaveBeenCalledWith(ws);
		});

		it('works without optional connection handlers', () => {
			wsServer.onConnection(vi.fn());

			const ws = makeWebSocket();

			expect(() => {
				getConnectionHandler()(ws);

				getSocketHandler<() => void>(ws, 'close')();
			}).not.toThrow();
		});
	});

	describe('message handling', () => {
		it.each([
			{
				name: 'Buffer',
				data: Buffer.from('buffer message'),
				expected: 'buffer message'
			},
			{
				name: 'ArrayBuffer',
				data: Uint8Array.from(Buffer.from('array buffer message')).buffer,
				expected: 'array buffer message'
			},
			{
				name: 'Buffer array',
				data: [Buffer.from('buffer '), Buffer.from('array')],
				expected: 'buffer array'
			}
		])('converts $name data to UTF-8 text', ({ data, expected }) => {
			const onMessage = vi.fn();

			wsServer.onConnection(onMessage);

			const ws = makeWebSocket();
			getConnectionHandler()(ws);

			const messageHandler = getSocketHandler<(data: RawData) => void>(ws, 'message');

			messageHandler(data as RawData);

			expect(onMessage).toHaveBeenCalledWith(expected, ws);
		});

		it('marks a connection as alive after receiving pong', () => {
			wsServer.onConnection(vi.fn());

			const ws = makeWebSocket();
			getConnectionHandler()(ws);

			ws.isAlive = false;

			getSocketHandler<() => void>(ws, 'pong')();

			expect(ws.isAlive).toBe(true);
		});
	});

	describe('send', () => {
		it('sends strings unchanged', () => {
			const ws = makeWebSocket();

			wsServer.send(ws, 'hello');

			expect(ws.send).toHaveBeenCalledWith('hello');
		});

		it('serializes non-string messages as JSON', () => {
			const ws = makeWebSocket();

			wsServer.send(ws, {
				message: 'hello'
			});

			expect(ws.send).toHaveBeenCalledWith('{"message":"hello"}');
		});
	});

	describe('broadcast', () => {
		it('broadcasts to open clients only', () => {
			const openClient = makeWebSocket(WebSocket.OPEN);
			const closedClient = makeWebSocket(WebSocket.CLOSED);

			wssInstance.clients.add(openClient);
			wssInstance.clients.add(closedClient);

			wsServer.broadcast('hello');

			expect(openClient.send).toHaveBeenCalledWith('hello');
			expect(closedClient.send).not.toHaveBeenCalled();
		});

		it('serializes non-string broadcast messages as JSON', () => {
			const client = makeWebSocket();

			wssInstance.clients.add(client);

			wsServer.broadcast({
				message: 'hello'
			});

			expect(client.send).toHaveBeenCalledWith('{"message":"hello"}');
		});
	});

	describe('heartbeat', () => {
		it('pings open and responsive connections', () => {
			const client = makeWebSocket();
			client.isAlive = true;

			wssInstance.clients.add(client);

			vi.advanceTimersByTime(30_000);

			expect(client.isAlive).toBe(false);
			expect(client.ping).toHaveBeenCalledTimes(1);
			expect(client.terminate).not.toHaveBeenCalled();
		});

		it('terminates an open connection that did not respond', () => {
			const client = makeWebSocket();
			client.isAlive = false;

			wssInstance.clients.add(client);

			vi.advanceTimersByTime(30_000);

			expect(client.terminate).toHaveBeenCalledTimes(1);
			expect(client.ping).not.toHaveBeenCalled();
		});

		it('ignores connections that are not open', () => {
			const client = makeWebSocket(WebSocket.CLOSED);
			client.isAlive = false;

			wssInstance.clients.add(client);

			vi.advanceTimersByTime(30_000);

			expect(client.ping).not.toHaveBeenCalled();
			expect(client.terminate).not.toHaveBeenCalled();
		});

		it('uses the configured heartbeat interval', () => {
			wsServer.close();

			process.env['WS_HEARTBEAT_MS'] = '1000';

			vi.clearAllMocks();
			createServer();

			const client = makeWebSocket();
			wssInstance.clients.add(client);

			vi.advanceTimersByTime(999);

			expect(client.ping).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);

			expect(client.ping).toHaveBeenCalledTimes(1);
		});

		it.each(['', '0', '-100', 'invalid'])('uses the default interval for invalid configuration "%s"', (value) => {
			wsServer.close();

			process.env['WS_HEARTBEAT_MS'] = value;

			vi.clearAllMocks();
			createServer();

			const client = makeWebSocket();
			wssInstance.clients.add(client);

			vi.advanceTimersByTime(29_999);

			expect(client.ping).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);

			expect(client.ping).toHaveBeenCalledTimes(1);
		});
	});

	describe('close', () => {
		it('closes the WebSocket server', () => {
			wsServer.close();

			expect(wssInstance.close).toHaveBeenCalledTimes(1);
		});

		it('stops heartbeat monitoring', () => {
			const client = makeWebSocket();

			wssInstance.clients.add(client);

			wsServer.close();

			vi.advanceTimersByTime(30_000);

			expect(client.ping).not.toHaveBeenCalled();
		});
	});
});
