/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage, PROTOCOL_VERSION } from '@application-platform/protocol';
import { WsServer } from '@application-platform/server-utils';
import { DeepMocked, Mock, resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { Logger } from '@application-platform/z21-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppWsServer } from './app-websocket-server';

// Mock the protocol validation function at module level
vi.mock('@application-platform/protocol', async () => {
	const actual = await vi.importActual<typeof import('@application-platform/protocol')>('@application-platform/protocol');
	return {
		...actual,
		isClientToServerMessage: vi.fn()
	};
});

describe('AppWsServer', () => {
	let wsServer: DeepMocked<WsServer>;
	let logger: DeepMocked<Logger>;
	let server: AppWsServer;

	beforeEach(() => {
		wsServer = Mock<WsServer>();
		logger = Mock<Logger>();

		resetMocksBeforeEach({ wsServer, logger, console });

		// Mock console.log to keep tests clean
		vi.spyOn(global.console, 'log').mockImplementation(() => {
			// do nothing
		});

		server = new AppWsServer(wsServer as any, logger as any);
	});

	it('sends server.replay.session.ready on new connection', () => {
		const onMessage = vi.fn();
		const onDisconnect = vi.fn();
		const onConnect = vi.fn();

		server.onConnection(onMessage, onDisconnect, onConnect);

		const onConnectHandler = wsServer.onConnection.mock.calls[0][2];
		const ws: any = { id: 'ws-1' };

		onConnectHandler(ws);

		expect(wsServer.send).toHaveBeenCalledWith(ws, {
			type: 'server.replay.session.ready',
			payload: {
				protocolVersion: PROTOCOL_VERSION,
				serverTime: expect.any(String),
				requestId: ''
			}
		});
	});

	it('ignores invalid JSON payloads', () => {
		const onMessage = vi.fn();
		server.onConnection(onMessage);
		const handler = wsServer.onConnection.mock.calls[0][0];
		const ws: any = {};

		handler('not-json', ws);

		expect(onMessage).not.toHaveBeenCalled();
	});

	it('rejects messages that fail validation', () => {
		(isClientToServerMessage as unknown as vi.Mock).mockReturnValue(false);
		const onMessage = vi.fn();
		server.onConnection(onMessage);
		const handler = wsServer.onConnection.mock.calls[0][0];
		const ws: any = {};

		handler(JSON.stringify({ bogus: true }), ws);

		expect(onMessage).not.toHaveBeenCalled();
	});

	it('forwards accepted messages to the provided handler', () => {
		(isClientToServerMessage as unknown as vi.Mock).mockImplementation((m: any) => !!m && typeof m === 'object' && m.type === 'ping');
		const onMessage = vi.fn();
		server.onConnection(onMessage);
		const handler = wsServer.onConnection.mock.calls[0][0];
		const ws: any = {};
		const msg = { type: 'ping' };

		handler(JSON.stringify(msg), ws);

		expect(onMessage).toHaveBeenCalledWith(msg, ws);
	});

	it('invokes disconnect handler when connection ends', () => {
		const onMessage = vi.fn();
		const onDisconnect = vi.fn();
		server.onConnection(onMessage, onDisconnect);

		const disconnect = wsServer.onConnection.mock.calls[0][1];
		const ws: any = { id: 'ws-1' };
		disconnect(ws);

		expect(onDisconnect).toHaveBeenCalled();
	});

	it('delegates sendToClient to underlying wsServer', () => {
		const ws: any = { id: 'ws-2' };
		server.sendToClient(ws, {
			type: 'server.replay.session.ready',
			payload: {
				protocolVersion: PROTOCOL_VERSION,
				serverTime: new Date().toISOString(),
				requestId: 'req-1'
			}
		});
		expect(wsServer.send).toHaveBeenCalledWith(ws, expect.objectContaining({ type: 'server.replay.session.ready' }));
	});

	it('delegates broadcast to underlying wsServer', () => {
		server.broadcast({
			type: 'server.replay.session.ready',
			payload: { protocolVersion: PROTOCOL_VERSION, serverTime: new Date().toISOString(), requestId: 'req-1' }
		});
		expect(wsServer.broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'server.replay.session.ready' }));
	});
});
