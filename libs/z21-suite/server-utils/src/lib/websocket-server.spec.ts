/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { vi, type Mock } from 'vitest';
import { WebSocketServer } from 'ws';

import { WsServer } from './websocket-server';

vi.mock('ws', () => {
	const clients = new Set();
	// Create a mock constructor function that initializes instance props and returns the instance.
	const WebSocketServer = vi.fn(function (this: any, _opts?: any) {
		this.clients = clients;
		this.on = vi.fn();
		return this;
	});
	return { WebSocketServer };
});

type WsMock = {
	on: Mock;
	send: Mock;
	readyState: number;
};

describe('WsServer', () => {
	let wsServer: WsServer;
	let wssInstance: { on: Mock; clients: Set<WsMock> };

	beforeEach(() => {
		(WebSocketServer as unknown as Mock).mockClear();
		const instance = (WebSocketServer as unknown as Mock).mock.instances[0] as { on?: Mock; clients?: Set<WsMock> } | undefined;
		instance?.on?.mockReset?.();
		instance?.clients?.clear?.();
		wsServer = new WsServer({} as any);
		wssInstance = (WebSocketServer as unknown as Mock).mock.results[0].value as { on: Mock; clients: Set<WsMock> };
	});

	it('registers connection handler and wires message and close events', () => {
		const onMessage = vi.fn();
		const onDisconnect = vi.fn();
		wsServer.onConnection(onMessage, onDisconnect);
		const connectionHandler = wssInstance.on.mock.calls.find((c: any[]) => c[0] === 'connection')?.[1];

		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1 };
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
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1 };
		connectionHandler?.(ws);
		const closeHandler = ws.on.mock.calls.find((c: any[]) => c[0] === 'close')?.[1];

		// Ensure there's at least one assertion and that the close handler (if present) is callable
		expect(typeof closeHandler).toBe('function');
		expect(() => closeHandler?.()).not.toThrow();
	});

	it('sends string directly and serializes objects', () => {
		const ws: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1 };
		wsServer.send(ws as any, 'hi');
		wsServer.send(ws as any, { a: 1 });

		expect(ws.send).toHaveBeenNthCalledWith(1, 'hi');
		expect(ws.send).toHaveBeenNthCalledWith(2, JSON.stringify({ a: 1 }));
	});

	it('broadcasts only to open clients and serializes non-string messages', () => {
		const wsOpen1: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1 };
		const wsOpen2: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 1 };
		const wsClosed: WsMock = { on: vi.fn(), send: vi.fn(), readyState: 3 };
		wssInstance.clients.add(wsOpen1);
		wssInstance.clients.add(wsOpen2);
		wssInstance.clients.add(wsClosed);

		wsServer.broadcast({ msg: 'hello' });

		expect(wsOpen1.send).toHaveBeenCalledWith(JSON.stringify({ msg: 'hello' }));
		expect(wsOpen2.send).toHaveBeenCalledWith(JSON.stringify({ msg: 'hello' }));
		expect(wsClosed.send).not.toHaveBeenCalled();
	});
});
