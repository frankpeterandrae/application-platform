/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { isClientToServerMessage, PROTOCOL_VERSION } from '@application-platform/protocol';
import { vi, type Mock } from 'vitest';

import { AppWsServer } from './app-websocket-server';

vi.mock('@application-platform/protocol', async () => {
	const actual = await vi.importActual('@application-platform/protocol');
	return { ...actual, isClientToServerMessage: vi.fn(actual.isClientToServerMessage) };
});

describe('AppWsServer', () => {
	let wsServer: {
		onConnection: Mock;
		send: Mock;
		broadcast: Mock;
	};
	let server: AppWsServer;

	beforeEach(() => {
		wsServer = {
			onConnection: vi.fn(),
			send: vi.fn(),
			broadcast: vi.fn()
		} as any;
		server = new AppWsServer(wsServer as any);
		vi.spyOn(global.console, 'log').mockImplementation(() => {
			// do nothing
		});
		(isClientToServerMessage as unknown as Mock).mockReset();
	});

	it('sends session.ready on new connection', () => {
		const onMessage = vi.fn();
		const onDisconnect = vi.fn();

		server.onConnection(onMessage, onDisconnect);

		const handler = wsServer.onConnection.mock.calls[0][0];
		const ws: any = { id: 'ws-1' };

		handler('{"type":"noop"}', ws);

		expect(wsServer.send).toHaveBeenCalledWith(ws, {
			type: 'server.replay.session.ready',
			protocolVersion: PROTOCOL_VERSION,
			serverTime: expect.any(String)
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
		(isClientToServerMessage as unknown as Mock).mockReturnValue(false);
		const onMessage = vi.fn();
		server.onConnection(onMessage);
		const handler = wsServer.onConnection.mock.calls[0][0];
		const ws: any = {};

		handler(JSON.stringify({ bogus: true }), ws);

		expect(onMessage).not.toHaveBeenCalled();
	});

	it('forwards accepted messages to the provided handler', () => {
		(isClientToServerMessage as unknown as Mock).mockImplementation((m: any) => !!m && typeof m === 'object' && m.type === 'ping');
		const onMessage = vi.fn();
		server.onConnection(onMessage);
		const handler = wsServer.onConnection.mock.calls[0][0];
		const ws: any = {};
		const msg = { type: 'ping' };

		handler(JSON.stringify(msg), ws);

		expect(onMessage).toHaveBeenCalledWith(msg);
	});

	it('invokes disconnect handler when connection ends', () => {
		const onMessage = vi.fn();
		const onDisconnect = vi.fn();
		server.onConnection(onMessage, onDisconnect);

		const disconnect = wsServer.onConnection.mock.calls[0][1];
		disconnect();

		expect(onDisconnect).toHaveBeenCalled();
	});

	it('delegates sendToClient to underlying wsServer', () => {
		const ws: any = { id: 'ws-2' };
		server.sendToClient(ws, { type: 'session.ready', protocolVersion: PROTOCOL_VERSION, serverTime: new Date().toISOString() });
		expect(wsServer.send).toHaveBeenCalledWith(ws, expect.objectContaining({ type: 'session.ready' }));
	});

	it('delegates broadcast to underlying wsServer', () => {
		server.broadcast({ type: 'session.ready', protocolVersion: PROTOCOL_VERSION, serverTime: new Date().toISOString() });
		expect(wsServer.broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'session.ready' }));
	});
});
