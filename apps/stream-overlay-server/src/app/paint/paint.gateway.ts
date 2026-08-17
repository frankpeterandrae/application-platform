/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Paint } from '@application-platform/paint';
import { PaintEvent, PaintRecentSelectionRepository } from '@application-platform/paint-data-access/server';
import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets';
import { WebSocket, WebSocketServer as WsServer } from 'ws';

import { PaintStateService } from './paint-state.service';

interface WebSocketMessage<T> {
	event: string;
	data: T;
}

/**
 * WebSocket gateway for handling paint-related events.
 */
@WebSocketGateway({
	path: '/ws'
})
export class PaintGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(PaintGateway.name);

	@WebSocketServer()
	private readonly server!: WsServer;

	constructor(
		private readonly paintStateService: PaintStateService,
		private readonly recentPaintRepository: PaintRecentSelectionRepository
	) {}

	/**
	 * Handles a newly connected WebSocket client.
	 *
	 * Sends the current paint to the client when one is available.
	 *
	 * @param client The connected WebSocket client.
	 */
	public handleConnection(client: WebSocket): void {
		this.logger.log('Client connected to PaintGateway');
		const currentPaint = this.paintStateService.getCurrentPaint();

		if (currentPaint) {
			client.send(
				JSON.stringify({
					event: 'paint.changed',
					data: currentPaint
				})
			);
		}
	}

	/**
	 * Handles the disconnection of a WebSocket client.
	 */
	public handleDisconnect(): void {
		this.logger.log('Client disconnected from PaintGateway');
	}

	/**
	 * Handles a paint selection received from a WebSocket client.
	 *
	 * Updates the current paint, records it as a recent selection and broadcasts
	 * the change to connected clients.
	 *
	 * @param paint The selected paint.
	 */
	@SubscribeMessage(PaintEvent.Select)
	public handlePaintSelect(@MessageBody() paint: Paint): void {
		this.logger.debug(`Received paint selection: ${JSON.stringify(paint)}`);

		this.paintStateService.setCurrentPaint(paint);

		this.recentPaintRepository.select(paint.id);

		this.broadcast({
			event: PaintEvent.Changed,
			data: paint
		});
	}

	/**
	 * Handles a request to clear the current paint selection from a WebSocket client.
	 */
	@SubscribeMessage(PaintEvent.Clear)
	public handleClearPaint(): void {
		this.paintStateService.clearCurrentPaint();

		this.broadcast({
			event: PaintEvent.Changed,
			data: undefined
		});
	}

	/**
	 * Sends the current paint to the requesting WebSocket client.
	 *
	 * @param client The WebSocket client requesting the current paint.
	 */
	@SubscribeMessage(PaintEvent.GetCurrent)
	public handleGetCurrent(@ConnectedSocket() client: WebSocket): void {
		const currentPaint = this.paintStateService.getCurrentPaint();

		if (!currentPaint) {
			return;
		}

		client.send(
			JSON.stringify({
				event: PaintEvent.Changed,
				data: currentPaint
			})
		);
	}

	/**
	 * Broadcasts a WebSocket message to all connected clients.
	 *
	 * @param message The message to broadcast.
	 * @template T The type of the message payload.
	 */
	private broadcast<T>(message: WebSocketMessage<T>): void {
		const payload = JSON.stringify(message);

		for (const client of this.server.clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(payload);
			}
		}
	}
}
