/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { CvNack, CvRead, CvResult, PROTOCOL_VERSION, type ClientToServer } from '@application-platform/protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../test-setup';

import { WsClientService } from './ws-client.service';

describe('WsClientService', () => {
	let originalWebSocket: any;
	let lastCreatedWs: any;

	// Use a factory function that returns a plain object instance to avoid
	// aliasing `this` to an outer variable and to keep ESLint happy.
	const MockWebSocket: any = function (url: string) {
		const inst: any = {
			url,
			readyState: MockWebSocket.OPEN,
			send: vi.fn(),
			close: vi.fn(),
			onopen: undefined,
			onclose: undefined,
			onmessage: undefined
		};
		lastCreatedWs = inst;
		return inst;
	};
	MockWebSocket.OPEN = 1;
	MockWebSocket.CLOSED = 3;

	beforeEach(async () => {
		await setupTestingModule({ providers: [WsClientService] });
		originalWebSocket = (global as any).WebSocket;
		lastCreatedWs = undefined;
		(global as any).WebSocket = MockWebSocket as any;
	});

	afterEach(() => {
		(global as any).WebSocket = originalWebSocket;
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('sends hello message on open with correct protocol version and clientName', () => {
		const service = TestBed.inject(WsClientService);

		// Simulate open
		expect(lastCreatedWs).toBeDefined();
		// Ensure readyState is OPEN so send goes through
		lastCreatedWs.readyState = (MockWebSocket as any).OPEN;
		lastCreatedWs.onopen?.();

		expect(lastCreatedWs.send).toHaveBeenCalledTimes(1);
		const send = JSON.parse(lastCreatedWs.send.mock.calls[0][0]);
		expect(send.type).toBe('server.command.session.hello');
		expect(send.payload.protocolVersion).toBe(PROTOCOL_VERSION);
		expect(send.payload.clientName).toBe('ui');
	});

	it('does not call underlying WebSocket.send when socket is not open', () => {
		// Replace constructor with a factory-based mock that creates a CLOSED socket
		const ClosedMockWebSocket: any = function (url: string) {
			const inst: any = {
				readyState: MockWebSocket.CLOSED,
				send: vi.fn(),
				close: vi.fn(),
				onopen: undefined,
				onclose: undefined,
				onmessage: undefined
			};
			lastCreatedWs = inst;
			return inst;
		};

		(global as any).WebSocket = ClosedMockWebSocket as any;

		const service = TestBed.inject(WsClientService);

		service.send({ type: 'some.message' } as unknown as ClientToServer);

		expect(lastCreatedWs.send).not.toHaveBeenCalled();
	});

	it('serializes messages when sending over an open socket', () => {
		const service = TestBed.inject(WsClientService);
		lastCreatedWs.readyState = (MockWebSocket as any).OPEN;

		const msg = { type: 'custom', foo: 'bar' };
		service.send(msg as any);

		expect(lastCreatedWs.send).toHaveBeenCalledWith(JSON.stringify(msg));
	});

	it('invokes registered handlers for incoming messages and updates lastMessage signal', () => {
		const service = TestBed.inject(WsClientService);

		const handler = vi.fn();
		const unregister = service.onMessage(handler);

		const incoming = { type: 'some.incoming', payload: { a: 1 } } as any;
		lastCreatedWs.onmessage?.({ data: JSON.stringify(incoming) });

		expect(handler).toHaveBeenCalledWith(incoming);

		// lastMessage should be a JSON array string containing the incoming message
		const last = service.lastMessage();
		expect(() => JSON.parse(last)).not.toThrow();
		const arr = JSON.parse(last) as any[];
		expect(arr).toHaveLength(1);
		expect(arr[0]).toEqual(incoming);

		// unregister and ensure handler not called for subsequent messages
		unregister();
		lastCreatedWs.onmessage?.({ data: JSON.stringify({ type: 'other' }) });
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('request resolves when a matching programming.replay.cv.result is received', async () => {
		const service = TestBed.inject(WsClientService);

		// Prepare request and capture sent message
		const promise = service.request((requestId) => ({ type: 'programming.command.cv.read', payload: { requestId } }) as CvRead);

		// Simulate server response with matching requestId
		const send = JSON.parse(lastCreatedWs.send.mock.calls[0][0]);
		const requestId = send.payload.requestId;

		const response = { type: 'programming.replay.cv.result', payload: { requestId, cvAdress: 42 } } as CvResult;
		lastCreatedWs.onmessage?.({ data: JSON.stringify(response) });

		await expect(promise).resolves.toEqual(response);
	});

	it('request rejects when a matching programming.replay.cv.nack is received', async () => {
		const service = TestBed.inject(WsClientService);

		const promise = service.request((requestId) => ({ type: 'programming.command.cv.read', payload: { requestId } }) as CvRead);

		const send = JSON.parse(lastCreatedWs.send.mock.calls[0][0]);
		const requestId = send.payload.requestId;

		const nack = { type: 'programming.replay.cv.nack', payload: { requestId, error: 'boom' } } as CvNack;
		lastCreatedWs.onmessage?.({ data: JSON.stringify(nack) });

		await expect(promise).rejects.toThrow('boom');
	});

	it('request times out if no response is received within timeoutMs', async () => {
		vi.useFakeTimers();
		const service = TestBed.inject(WsClientService);

		const promise = service.request((requestId) => ({ type: 'programming.command.cv.read', payload: { requestId } }) as CvRead, {
			timeoutMs: 10
		});

		// Advance timers to trigger timeout
		vi.advanceTimersByTime(20);

		await expect(promise).rejects.toThrow('Request timed out');
	});
});
