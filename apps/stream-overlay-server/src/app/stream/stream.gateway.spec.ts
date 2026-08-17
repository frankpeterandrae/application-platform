/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { StreamEvent, StreamState } from '@application-platform/interfaces';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';

import { StreamStateService } from './stream-state.service';
import { StreamGateway } from './stream.gateway';

describe('StreamGateway', () => {
	let gateway: StreamGateway;

	const streamStateService = {
		getState: vi.fn(),
		updateState: vi.fn()
	};

	const state: StreamState = {
		title: 'Miniaturen bemalen',
		subtitle: 'Sky Lantern'
	};

	beforeEach(() => {
		vi.clearAllMocks();

		streamStateService.getState.mockReturnValue(state);

		gateway = new StreamGateway(streamStateService as unknown as StreamStateService);
	});

	describe('handleConnection', () => {
		it('should send the current state to a newly connected client', () => {
			const client = {
				send: vi.fn()
			} as unknown as WebSocket;

			gateway.handleConnection(client);

			expect(client.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: StreamEvent.StateChanged,
					data: state
				})
			);
		});
	});

	describe('handleGetState', () => {
		it('should send the current state to the requesting client', () => {
			const client = {
				send: vi.fn()
			} as unknown as WebSocket;

			gateway.handleGetState(client);

			expect(streamStateService.getState).toHaveBeenCalledOnce();

			expect(client.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: StreamEvent.StateChanged,
					data: state
				})
			);
		});
	});

	describe('handleUpdateState', () => {
		it('should update the stream state', () => {
			Object.assign(gateway, {
				server: {
					clients: new Set()
				}
			});

			const update: Partial<StreamState> = {
				title: 'Blood Angels'
			};

			gateway.handleUpdateState(update);

			expect(streamStateService.updateState).toHaveBeenCalledWith(update);
		});

		it('should broadcast the complete updated state to open clients', () => {
			const openClient = {
				readyState: WebSocket.OPEN,
				send: vi.fn()
			};

			const closedClient = {
				readyState: WebSocket.CLOSED,
				send: vi.fn()
			};

			const updatedState: StreamState = {
				title: 'Blood Angels',
				subtitle: 'Sky Lantern'
			};

			streamStateService.getState.mockReturnValue(updatedState);

			Object.assign(gateway, {
				server: {
					clients: new Set([openClient, closedClient])
				}
			});

			gateway.handleUpdateState({
				title: 'Blood Angels'
			});

			expect(openClient.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: StreamEvent.StateChanged,
					data: updatedState
				})
			);

			expect(closedClient.send).not.toHaveBeenCalled();
		});
	});
});
