/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DeepMocked, Mock } from '@application-platform/shared-node-test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import { WsServer } from './websocket-server';

// Mock the 'ws' module with a constructable mock so `new WebSocketServer()` works.
vi.mock('ws', () => {
	const WebSocketServer = vi.fn(function (this: any, _opts?: any) {
		// Constructed instances should expose `clients` and `on`.
		this.clients = new Set();
		this.on = vi.fn();
	});
	return { WebSocketServer };
});

describe('WsServer', () => {
	let wsServer: WsServer;
	let wssInstance: any;

	// Helper function to create mock WebSocket client (similar to makeProviders in bootstrap.spec.ts)
	function makeMockWebSocket(overrides: Partial<WebSocket> = {}): DeepMocked<WebSocket> {
		const mock = Mock<WebSocket>();
		// Use Object.defineProperty for readonly properties
		Object.defineProperty(mock, 'readyState', {
			value: overrides.readyState ?? 1, // OPEN state by default
			writable: true,
			configurable: true
		});
		// Apply other overrides
		Object.keys(overrides).forEach((key) => {
			if (key !== 'readyState') {
				(mock as any)[key] = (overrides as any)[key];
			}
		});
		return mock;
	}

	// Helper function to get connection handler from wss.on calls
	function getConnectionHandler(): ((ws: WebSocket) => void) | undefined {
		return wssInstance.on.mock.calls.find((c) => c[0] === 'connection')?.[1];
	}

	// Helper function to get message handler from ws.on calls
	function getMessageHandler(ws: DeepMocked<WebSocket>): ((data: any) => void) | undefined {
		return ws.on.mock.calls.find((c) => c[0] === 'message')?.[1];
	}

	// Helper function to get close handler from ws.on calls
	function getCloseHandler(ws: DeepMocked<WebSocket>): (() => void) | undefined {
		return ws.on.mock.calls.find((c) => c[0] === 'close')?.[1];
	}

	// Helper function to get pong handler from ws.on calls
	function getPongHandler(ws: DeepMocked<WebSocket>): (() => void) | undefined {
		return ws.on.mock.calls.find((c) => c[0] === 'pong')?.[1];
	}

	beforeEach(() => {
		vi.clearAllMocks();
		(WebSocketServer as unknown as vi.Mock).mockClear();
		wsServer = new WsServer({} as any);
		// When a mock is used as a constructor, constructed instances are in mock.instances
		wssInstance = (WebSocketServer as unknown as vi.Mock).mock.instances[0];
		// Clear clients set from previous tests
		wssInstance.clients.clear();
	});

	describe('connection handling', () => {
		it('registers connection handler and wires message and close events', () => {
			const onMessage = vi.fn();
			const onDisconnect = vi.fn();
			wsServer.onConnection(onMessage, onDisconnect);

			const connectionHandler = getConnectionHandler();
			const ws = makeMockWebSocket();
			connectionHandler?.(ws as any);

			const messageHandler = getMessageHandler(ws);
			const closeHandler = getCloseHandler(ws);

			messageHandler?.('payload');
			closeHandler?.();

			// Check that callbacks were called with the correct first parameter
			expect(onMessage).toHaveBeenCalledTimes(1);
			expect(onMessage.mock.calls[0][0]).toBe('payload');
			expect(onDisconnect).toHaveBeenCalledTimes(1);
		});

		it('does not call onDisconnect if not provided', () => {
			const onMessage = vi.fn();
			wsServer.onConnection(onMessage);

			const connectionHandler = getConnectionHandler();
			const ws = makeMockWebSocket();
			connectionHandler?.(ws as any);

			const closeHandler = getCloseHandler(ws);

			expect(() => closeHandler?.()).not.toThrow();
		});

		it('calls onConnect when client connects', () => {
			const onMessage = vi.fn();
			const onConnect = vi.fn();
			wsServer.onConnection(onMessage, undefined, onConnect);

			const connectionHandler = getConnectionHandler();
			const ws = makeMockWebSocket();

			expect(connectionHandler).toBeDefined();
			connectionHandler?.(ws as any);

			expect(onConnect).toHaveBeenCalledTimes(1);
		});

		it('does not call onConnect if not provided', () => {
			const onMessage = vi.fn();
			wsServer.onConnection(onMessage);

			const connectionHandler = getConnectionHandler();
			const ws = makeMockWebSocket();

			expect(() => connectionHandler?.(ws as any)).not.toThrow();
		});

		it('sets isAlive to true on new connection', () => {
			const onMessage = vi.fn();
			wsServer.onConnection(onMessage);

			const connectionHandler = getConnectionHandler();
			const ws: any = makeMockWebSocket();

			connectionHandler?.(ws);

			expect(ws.isAlive).toBe(true);
		});
	});

	describe('message handling', () => {
		it('converts Buffer message data to string', () => {
			const onMessage = vi.fn();
			wsServer.onConnection(onMessage);

			const connectionHandler = getConnectionHandler();
			const ws = makeMockWebSocket();
			connectionHandler?.(ws as any);

			const messageHandler = getMessageHandler(ws);
			const buffer = { toString: vi.fn().mockReturnValue('converted') };

			messageHandler?.(buffer);

			expect(buffer.toString).toHaveBeenCalledTimes(1);
			expect(onMessage).toHaveBeenCalledTimes(1);
			expect(onMessage.mock.calls[0][0]).toBe('converted');
		});
	});

	describe('sending messages', () => {
		it('sends string directly and serializes objects', () => {
			const ws = makeMockWebSocket();

			wsServer.send(ws as any, 'hi');
			wsServer.send(ws as any, { a: 1 });

			expect(ws.send).toHaveBeenNthCalledWith(1, 'hi');
			expect(ws.send).toHaveBeenNthCalledWith(2, JSON.stringify({ a: 1 }));
		});
	});

	describe('broadcasting', () => {
		it('broadcasts only to open clients and serializes non-string messages', () => {
			// Create simple mock objects without using Mock<WebSocket> for this test
			// because Set operations with Proxy objects cause issues
			const wsOpen1: any = {
				readyState: 1,
				send: vi.fn(),
				on: vi.fn(),
				close: vi.fn(),
				terminate: vi.fn()
			};
			const wsOpen2: any = {
				readyState: 1,
				send: vi.fn(),
				on: vi.fn(),
				close: vi.fn(),
				terminate: vi.fn()
			};
			const wsClosed: any = {
				readyState: 3,
				send: vi.fn(),
				on: vi.fn(),
				close: vi.fn(),
				terminate: vi.fn()
			};

			wssInstance.clients.add(wsOpen1);
			wssInstance.clients.add(wsOpen2);
			wssInstance.clients.add(wsClosed);

			wsServer.broadcast({ msg: 'hello' });

			expect(wsOpen1.send).toHaveBeenCalledWith(JSON.stringify({ msg: 'hello' }));
			expect(wsOpen2.send).toHaveBeenCalledWith(JSON.stringify({ msg: 'hello' }));
			expect(wsClosed.send).not.toHaveBeenCalled();
		});

		it('broadcasts string messages directly without serialization', () => {
			// Create simple mock object
			const wsOpen: any = {
				readyState: 1,
				send: vi.fn(),
				on: vi.fn(),
				close: vi.fn(),
				terminate: vi.fn()
			};
			wssInstance.clients.add(wsOpen);

			wsServer.broadcast('plain text');

			expect(wsOpen.send).toHaveBeenCalledWith('plain text');
		});
	});

	describe('heartbeat handling', () => {
		it('sets isAlive to true when pong is received', () => {
			const onMessage = vi.fn();
			wsServer.onConnection(onMessage);

			const connectionHandler = getConnectionHandler();
			const ws: any = makeMockWebSocket();
			connectionHandler?.(ws);

			const pongHandler = getPongHandler(ws);
			ws.isAlive = false;

			pongHandler?.();

			expect(ws.isAlive).toBe(true);
		});
	});
});
