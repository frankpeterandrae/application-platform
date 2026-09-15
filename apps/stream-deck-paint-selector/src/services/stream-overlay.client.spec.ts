/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PaintEvent } from '@application-platform/paint-protocol';

import { StreamOverlayClient } from './stream-overlay.client';

const mocks = vi.hoisted(() => ({
	sockets: [] as Array<{
		readyState: number;
		send: ReturnType<typeof vi.fn>;
		once: ReturnType<typeof vi.fn>;
		emit: (event: string) => void;
	}>
}));

vi.mock('ws', () => {
	class WebSocketMock {
		public static readonly CONNECTING = 0;
		public static readonly OPEN = 1;
		public static readonly CLOSING = 2;
		public static readonly CLOSED = 3;

		public readyState = WebSocketMock.CONNECTING;

		public readonly send = vi.fn();

		private readonly listeners = new Map<string, () => void>();

		public readonly once = vi.fn((event: string, listener: () => void): this => {
			this.listeners.set(event, listener);

			return this;
		});

		constructor(public readonly url: string) {
			mocks.sockets.push(this);
		}

		public emit(event: string): void {
			this.listeners.get(event)?.();
			this.listeners.delete(event);
		}
	}

	return {
		WebSocket: WebSocketMock
	};
});

describe('StreamOverlayClient', () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		mocks.sockets.length = 0;

		vi.stubGlobal('fetch', fetchMock);

		fetchMock.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each([
		['getBrands', '/api/paint-brands'],
		['getPaints', '/api/paints'],
		['getRecentPaints', '/api/recent']
	] as const)('should load data using %s', async (method, path) => {
		const data = [{ id: 'test' }];

		fetchMock.mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(data)
		});

		const client = new StreamOverlayClient();

		const result = await client[method]();

		expect(fetchMock).toHaveBeenCalledWith(`http://localhost:3000${path}`);
		expect(result).toEqual(data);
	});

	it('should throw when a request fails', async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error'
		});

		const client = new StreamOverlayClient();

		await expect(client.getBrands()).rejects.toThrow('Request failed: 500 Internal Server Error');
	});

	it('should send a paint immediately when the socket is open', () => {
		const client = new StreamOverlayClient();

		client.selectPaint({
			id: 'citadel:21-03'
		} as never);

		const socket = mocks.sockets[0];

		socket.readyState = 1;
		socket.emit('open');

		expect(socket.send).toHaveBeenCalledWith(
			JSON.stringify({
				event: PaintEvent.Select,
				data: {
					id: 'citadel:21-03'
				}
			})
		);
	});

	it('should send clear when the socket opens', () => {
		const client = new StreamOverlayClient();

		client.clearPaint();

		const socket = mocks.sockets[0];

		socket.readyState = 1;
		socket.emit('open');

		expect(socket.send).toHaveBeenCalledWith(
			JSON.stringify({
				event: PaintEvent.Clear
			})
		);
	});

	it('should create a new socket after the previous connection was closed', () => {
		const client = new StreamOverlayClient();

		client.clearPaint();

		const firstSocket = mocks.sockets[0];

		firstSocket.readyState = 3;
		firstSocket.emit('close');

		client.clearPaint();

		expect(mocks.sockets).toHaveLength(2);
	});

	it('should create a new socket after a connection error', () => {
		const client = new StreamOverlayClient();

		client.clearPaint();

		const firstSocket = mocks.sockets[0];

		firstSocket.emit('error');

		client.clearPaint();

		expect(mocks.sockets).toHaveLength(2);
	});

	it('should send immediately when the socket is already open', () => {
		const client = new StreamOverlayClient();

		client.clearPaint();

		const socket = mocks.sockets[0];

		socket.readyState = 1;
		socket.emit('open');

		socket.send.mockClear();

		client.clearPaint();

		expect(socket.send).toHaveBeenCalledWith(
			JSON.stringify({
				event: PaintEvent.Clear
			})
		);
	});
});
