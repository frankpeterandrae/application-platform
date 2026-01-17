/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { WebSocketServer } from 'ws';

import { WsServer } from './websocket-server';

vi.mock('ws', () => {
	// Do not use a closure-shared clients Set; create one per mocked instance instead.
	// Create a mock constructor function that initializes instance props and returns the instance.
	const WebSocketServer = vi.fn(function (this: any, _opts?: any) {
		this.clients = new Set();
		this.on = vi.fn();
		this.close = vi.fn(() => {
			for (const c of this.clients) {
				if (c && typeof c.close === 'function') c.close();
			}
		});
		return this;
	});
	return { WebSocketServer };
});

type WsMock = {
	on: Mock;
	send: Mock;
	readyState: number;
	close: Mock;
};

describe('WsServer', () => {
	let wsServer: WsServer;
	let wssInstance: { on: Mock; clients: Set<WsMock>; close: Mock };

	beforeEach(() => {
		(WebSocketServer as unknown as Mock).mockClear();
		const instance = (WebSocketServer as unknown as Mock).mock.instances[0] as { on?: Mock; clients?: Set<WsMock> } | undefined;
		instance?.on?.mockReset?.();
		instance?.clients?.clear?.();
		wsServer = new WsServer({} as any);
		wssInstance = (WebSocketServer as unknown as Mock).mock.results[0].value as { on: Mock; clients: Set<WsMock>; close: Mock };
	});

	it('registers connection handler and wires message and close events', () => {
		const onMessage = vi.fn();
		const onDisconnect = vi.fn();
		wsServer.onConnection(onMessage, onDisconnect);
		const connectionHandler = wssInstance.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];

		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		connectionHandler?.(ws);

		const messageHandler = ws.on.mock.calls.find((c: any[]) => c[0] === 'message')?.[1];
		const closeHandler = ws.on.mock.calls.find((c: any[]) => c[0] === 'close')?.[1];

		messageHandler?.('payload');
		closeHandler?.();

		expect(onMessage).toHaveBeenCalledWith('payload', ws);
		expect(onDisconnect).toHaveBeenCalledWith(ws);
	});

	it('does not call onDisconnect if not provided', () => {
		const onMessage = vi.fn();
		wsServer.onConnection(onMessage);
		const connectionHandler = wssInstance.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		connectionHandler?.(ws);
		const closeHandler = ws.on.mock.calls.find((c: any[]) => c[0] === 'close')?.[1];

		// Ensure there's at least one assertion and that the close handler (if present) is callable
		expect(typeof closeHandler).toBe('function');
		expect(() => closeHandler?.()).not.toThrow();
	});

	it('sends string directly and serializes objects', () => {
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		wsServer.send(ws as any, 'hi');
		wsServer.send(ws as any, { a: 1 });

		expect(ws.send).toHaveBeenNthCalledWith(1, 'hi');
		expect(ws.send).toHaveBeenNthCalledWith(2, JSON.stringify({ a: 1 }));
	});

	it('broadcasts only to open clients and serializes non-string messages', () => {
		const wsOpen1: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		const wsOpen2: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		const wsClosed: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 3, close: vi.fn() };
		wssInstance.clients.add(wsOpen1);
		wssInstance.clients.add(wsOpen2);
		wssInstance.clients.add(wsClosed);

		wsServer.broadcast({ msg: 'hello' });

		expect(wsOpen1.send).toHaveBeenCalledWith(JSON.stringify({ msg: 'hello' }));
		expect(wsOpen2.send).toHaveBeenCalledWith(JSON.stringify({ msg: 'hello' }));
		expect(wsClosed.send).not.toHaveBeenCalled();
	});

	it('close calls underlying wss.close', () => {
		const wsOpen1: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 3, close: vi.fn() };
		wssInstance.clients.add(wsOpen1);
		wsServer.close();
		expect(wssInstance.close).toHaveBeenCalled();
	});

	it('broadcasts string messages directly without serialization', () => {
		const wsOpen: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		wssInstance.clients.add(wsOpen);

		wsServer.broadcast('plain text');

		expect(wsOpen.send).toHaveBeenCalledWith('plain text');
	});

	it('calls onConnect when client connects', () => {
		const onMessage = vi.fn();
		const onConnect = vi.fn();
		wsServer.onConnection(onMessage, undefined, onConnect);
		const connectionHandler = wssInstance.on.mock.calls.find((c) => c[0] === 'connection')?.[1];
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };

		expect(connectionHandler).toBeDefined();
		connectionHandler?.(ws);

		expect(onConnect).toHaveBeenCalledTimes(1);
		expect(onConnect).toHaveBeenCalledWith(ws);
	});

	it('does not call onConnect if not provided', () => {
		const onMessage = vi.fn();
		wsServer.onConnection(onMessage);
		const connectionHandler = wssInstance.on.mock.calls.find((c) => c[0] === 'connection')?.[1];
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };

		expect(() => connectionHandler?.(ws)).not.toThrow();
	});

	it('converts Buffer message data to string', () => {
		const onMessage = vi.fn();
		wsServer.onConnection(onMessage);
		const connectionHandler = wssInstance.on.mock.calls.find((c) => c[0] === 'connection')?.[1];
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };
		connectionHandler?.(ws);
		const messageHandler = ws.on.mock.calls.find((c) => c[0] === 'message')?.[1];
		const buffer = { toString: vi.fn().mockReturnValue('converted') };

		messageHandler?.(buffer);

		expect(buffer.toString).toHaveBeenCalledTimes(1);
		expect(onMessage).toHaveBeenCalledTimes(1);
		expect(onMessage).toHaveBeenCalledWith('converted', ws);
	});

	it('sets isAlive to true on new connection', () => {
		const onMessage = vi.fn();
		wsServer.onConnection(onMessage);
		const connectionHandler = wssInstance.on.mock.calls.find((c) => c[0] === 'connection')?.[1];
		const ws: any = { on: vi.fn(), send: vi.fn(), readyState: 1, close: vi.fn() };

		connectionHandler?.(ws);

		expect(ws.isAlive).toBe(true);
	});

	it('sets isAlive to true when pong is received', () => {
		const onMessage = vi.fn();
		wsServer.onConnection(onMessage);
		const connectionHandler = wssInstance.on.mock.calls.find((c) => c[0] === 'connection')?.[1];
		const ws: any = { on: vi.fn(), send: vi.fn(), readyState: 1 };
		connectionHandler?.(ws);
		const pongHandler = ws.on.mock.calls.find((c: any) => c[0] === 'pong')?.[1];
		ws.isAlive = false;

		pongHandler?.();

		expect(ws.isAlive).toBe(true);
	});

	it('heartbeat pings alive clients and terminates unresponsive clients', () => {
		// set short interval before constructing server to ensure constructor-created heartbeat respects env
		process.env['WS_HEARTBEAT_MS'] = '10';
		vi.useFakeTimers();

		// construct a fresh WsServer instance so the heartbeat interval picks up the env value
		const localWsServer = new WsServer({} as any);
		const localWssInstance = (WebSocketServer as unknown as Mock).mock.results.slice(-1)[0].value as { clients: Set<any> };

		const alive = { on: vi.fn(), send: vi.fn(), readyState: 1, isAlive: true, ping: vi.fn(), terminate: vi.fn() } as any;
		const dead = { on: vi.fn(), send: vi.fn(), readyState: 1, isAlive: false, ping: vi.fn(), terminate: vi.fn() } as any;

		localWssInstance.clients.add(alive);
		localWssInstance.clients.add(dead);

		// advance timers so heartbeat runs at least once
		vi.advanceTimersByTime(50);

		// alive client should have been pinged
		expect(alive.ping).toHaveBeenCalled();

		// dead client should have been terminated
		expect(dead.terminate).toHaveBeenCalled();

		vi.useRealTimers();
		delete process.env['WS_HEARTBEAT_MS'];
	});

	it('heartbeat does not ping clients that are not OPEN', () => {
		vi.useFakeTimers();
		// create server with default heartbeat
		const localWsServer = new WsServer({} as any);
		const localWssInstance = (WebSocketServer as unknown as Mock).mock.results.slice(-1)[0].value as { clients: Set<any> };

		const notOpen = { on: vi.fn(), send: vi.fn(), readyState: 3, isAlive: true, ping: vi.fn(), terminate: vi.fn() } as any;

		localWssInstance.clients.add(notOpen);

		// call private startHeartbeat to ensure an interval is present (constructor already started one,
		// but calling again is harmless in test contexts)
		(localWsServer as any).startHeartbeat?.();

		// fast-forward a tick to let heartbeat logic run
		vi.advanceTimersByTime(50);

		expect(notOpen.ping).not.toHaveBeenCalled();
		expect(notOpen.terminate).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});
