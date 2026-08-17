/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { StreamEvent, StreamState } from '@application-platform/interfaces';
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

import { StreamStateService } from './stream-state.service';

interface WebSocketMessage<T> {
	event: string;
	data: T;
}

/**
 * WebSocket gateway for handling stream-related events.
 */
@WebSocketGateway({
	path: '/ws'
})
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(StreamGateway.name);

	@WebSocketServer()
	private readonly server!: WsServer;

	constructor(private readonly streamStateService: StreamStateService) {}

	/**
	 * Handles a newly connected WebSocket client.
	 *
	 * Sends the current stream to the client when one is available.
	 *
	 * @param client The connected WebSocket client.
	 */
	public handleConnection(client: WebSocket): void {
		this.logger.log('Client connected to StreamGateway');

		client.send(
			JSON.stringify({
				event: StreamEvent.StateChanged,
				data: this.streamStateService.getState()
			})
		);
	}

	/**
	 * Handles the disconnection of a WebSocket client.
	 */
	public handleDisconnect(): void {
		this.logger.log('Client disconnected from StreamGateway');
	}

	/**
	 * Handles a stream selection received from a WebSocket client.
	 *
	 * Updates the current stream, records it as a recent selection and broadcasts
	 * the change to connected clients.
	 *
	 * @param stream The selected stream.
	 */
	@SubscribeMessage(StreamEvent.UpdateState)
	public handleUpdateState(@MessageBody() stream: Partial<StreamState>): void {
		this.logger.debug(`Received stream selection: ${JSON.stringify(stream)}`);

		this.streamStateService.updateState(stream);

		this.broadcast({
			event: StreamEvent.StateChanged,
			data: this.streamStateService.getState()
		});
	}

	/**
	 * Sends the current stream to the requesting WebSocket client.
	 *
	 * @param client The WebSocket client requesting the current stream.
	 */
	@SubscribeMessage(StreamEvent.GetState)
	public handleGetState(@ConnectedSocket() client: WebSocket): void {
		client.send(
			JSON.stringify({
				event: StreamEvent.StateChanged,
				data: this.streamStateService.getState()
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
