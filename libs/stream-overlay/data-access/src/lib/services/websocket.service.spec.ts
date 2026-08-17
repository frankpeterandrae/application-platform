/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebSocketService } from './websocket.service';

class MockWebSocket {
	public static readonly CONNECTING = 0;
	public static readonly OPEN = 1;
	public static readonly CLOSING = 2;
	public static readonly CLOSED = 3;

	public static instances: MockWebSocket[] = [];

	public readonly send = vi.fn();

	public readyState = MockWebSocket.CONNECTING;

	private readonly listeners = new Map<
		string,
		Array<{
			callback: (event: Event) => void;
			once: boolean;
		}>
	>();

	constructor(public readonly url: string) {
		MockWebSocket.instances.push(this);
	}

	public addEventListener(type: string, callback: EventListener, options?: AddEventListenerOptions | boolean): void {
		const listeners = this.listeners.get(type) ?? [];

		listeners.push({
			callback: callback as (event: Event) => void,
			once: typeof options === 'object' && options.once === true
		});

		this.listeners.set(type, listeners);
	}

	public dispatch(type: string, event?: Event): void {
		const listeners = [...(this.listeners.get(type) ?? [])];

		for (const listener of listeners) {
			listener.callback(event ?? new Event(type));

			if (listener.once) {
				const current = this.listeners.get(type) ?? [];

				this.listeners.set(
					type,
					current.filter((entry) => entry !== listener)
				);
			}
		}
	}
}

describe('WebSocketService', () => {
	let service: WebSocketService;
	let socket: MockWebSocket;

	beforeEach(() => {
		MockWebSocket.instances = [];

		vi.stubGlobal('WebSocket', MockWebSocket);

		TestBed.resetTestingModule();

		service = TestBed.inject(WebSocketService);

		socket = MockWebSocket.instances[0];
	});

	it('should connect to the stream overlay websocket', () => {
		expect(socket.url).toBe('ws://localhost:3000/ws');
	});

	it('should initially be disconnected', () => {
		expect(service.connected()).toBe(false);
	});

	it('should set connected state when socket opens', () => {
		socket.readyState = MockWebSocket.OPEN;

		socket.dispatch('open');

		expect(service.connected()).toBe(true);
	});

	it('should set disconnected state when socket closes', () => {
		socket.readyState = MockWebSocket.OPEN;
		socket.dispatch('open');

		expect(service.connected()).toBe(true);

		socket.readyState = MockWebSocket.CLOSED;
		socket.dispatch('close');

		expect(service.connected()).toBe(false);
	});

	describe('send', () => {
		it('should send a serialized websocket message when connected', () => {
			socket.readyState = MockWebSocket.OPEN;

			service.send('paint.select', {
				id: 'citadel:1'
			});

			expect(socket.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: 'paint.select',
					data: {
						id: 'citadel:1'
					}
				})
			);
		});

		it('should not send while socket is not open', () => {
			socket.readyState = MockWebSocket.CONNECTING;

			service.send('paint.select', {
				id: 'citadel:1'
			});

			expect(socket.send).not.toHaveBeenCalled();
		});
	});

	describe('sendWhenConnected', () => {
		it('should send immediately when socket is already open', () => {
			socket.readyState = MockWebSocket.OPEN;

			service.sendWhenConnected('paint.get-current', undefined);

			expect(socket.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: 'paint.get-current',
					data: undefined
				})
			);
		});

		it('should wait until the socket opens', () => {
			socket.readyState = MockWebSocket.CONNECTING;

			service.sendWhenConnected('paint.get-current', undefined);

			expect(socket.send).not.toHaveBeenCalled();

			socket.readyState = MockWebSocket.OPEN;
			socket.dispatch('open');

			expect(socket.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: 'paint.get-current',
					data: undefined
				})
			);
		});

		it('should send a queued message only once', () => {
			socket.readyState = MockWebSocket.CONNECTING;

			service.sendWhenConnected('paint.get-current', undefined);

			socket.readyState = MockWebSocket.OPEN;

			socket.dispatch('open');
			socket.dispatch('open');

			expect(socket.send).toHaveBeenCalledTimes(1);
		});
	});

	describe('on', () => {
		it('should emit data for the requested event', () => {
			const received: unknown[] = [];

			service.on<{ id: string }>('paint.changed').subscribe((data) => {
				received.push(data);
			});

			socket.dispatch(
				'message',
				new MessageEvent('message', {
					data: JSON.stringify({
						event: 'paint.changed',
						data: {
							id: 'citadel:21-03'
						}
					})
				})
			);

			expect(received).toEqual([
				{
					id: 'citadel:21-03'
				}
			]);
		});

		it('should ignore messages for other events', () => {
			const callback = vi.fn();

			service.on('paint.changed').subscribe(callback);

			socket.dispatch(
				'message',
				new MessageEvent('message', {
					data: JSON.stringify({
						event: 'other.event',
						data: {
							value: 42
						}
					})
				})
			);

			expect(callback).not.toHaveBeenCalled();
		});
	});
});
