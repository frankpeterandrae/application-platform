/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint } from '@application-platform/paint';
import { PaintEvent, PaintRecentSelectionRepository } from '@application-platform/paint-data-access/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';

import { PaintStateService } from './paint-state.service';
import { PaintGateway } from './paint.gateway';

describe('PaintGateway', () => {
	let gateway: PaintGateway;

	const paintStateService = {
		getCurrentPaint: vi.fn(),
		setCurrentPaint: vi.fn(),
		clearCurrentPaint: vi.fn()
	};

	const recentPaintRepository = {
		select: vi.fn()
	};

	const paint: Paint = {
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		mainColor: '#991115',
		colorGroups: ['red']
	};

	beforeEach(() => {
		vi.clearAllMocks();

		gateway = new PaintGateway(
			paintStateService as unknown as PaintStateService,
			recentPaintRepository as unknown as PaintRecentSelectionRepository
		);
	});

	describe('handleConnection', () => {
		it('should send current paint to a newly connected client', () => {
			paintStateService.getCurrentPaint.mockReturnValue(paint);

			const client = {
				send: vi.fn()
			} as unknown as WebSocket;

			gateway.handleConnection(client);

			expect(client.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: PaintEvent.Changed,
					data: paint
				})
			);
		});

		it('should not send anything when there is no current paint', () => {
			paintStateService.getCurrentPaint.mockReturnValue(undefined);

			const client = {
				send: vi.fn()
			} as unknown as WebSocket;

			gateway.handleConnection(client);

			expect(client.send).not.toHaveBeenCalled();
		});
	});

	describe('handleGetCurrent', () => {
		it('should send current paint to requesting client', () => {
			paintStateService.getCurrentPaint.mockReturnValue(paint);

			const client = {
				send: vi.fn()
			} as unknown as WebSocket;

			gateway.handleGetCurrent(client);

			expect(client.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: PaintEvent.Changed,
					data: paint
				})
			);
		});

		it('should not send anything when there is no current paint', () => {
			paintStateService.getCurrentPaint.mockReturnValue(undefined);

			const client = {
				send: vi.fn()
			} as unknown as WebSocket;

			gateway.handleGetCurrent(client);

			expect(client.send).not.toHaveBeenCalled();
		});
	});

	describe('handlePaintSelect', () => {
		it('should update current paint and recent paints', () => {
			const server = {
				clients: new Set()
			};

			Object.assign(gateway, { server });

			gateway.handlePaintSelect(paint);

			expect(paintStateService.setCurrentPaint).toHaveBeenCalledWith(paint);

			expect(recentPaintRepository.select).toHaveBeenCalledWith(paint.id);
		});

		it('should broadcast selected paint to open clients', () => {
			const openClient = {
				readyState: WebSocket.OPEN,
				send: vi.fn()
			};

			const closedClient = {
				readyState: WebSocket.CLOSED,
				send: vi.fn()
			};

			Object.assign(gateway, {
				server: {
					clients: new Set([openClient, closedClient])
				}
			});

			gateway.handlePaintSelect(paint);

			const payload = JSON.stringify({
				event: PaintEvent.Changed,
				data: paint
			});

			expect(openClient.send).toHaveBeenCalledWith(payload);

			expect(closedClient.send).not.toHaveBeenCalled();
		});
	});

	describe('handleClearPaint', () => {
		it('should clear current paint and broadcast the change to open clients', () => {
			const openClient = {
				readyState: WebSocket.OPEN,
				send: vi.fn()
			};

			const closedClient = {
				readyState: WebSocket.CLOSED,
				send: vi.fn()
			};

			Object.assign(gateway, {
				server: {
					clients: new Set([openClient, closedClient])
				}
			});

			gateway.handleClearPaint();

			expect(paintStateService.clearCurrentPaint).toHaveBeenCalledOnce();

			expect(openClient.send).toHaveBeenCalledWith(
				JSON.stringify({
					event: PaintEvent.Changed
				})
			);

			expect(closedClient.send).not.toHaveBeenCalled();
		});
	});
});
