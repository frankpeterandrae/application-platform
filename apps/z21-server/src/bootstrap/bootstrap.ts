/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ServerToClient } from '@application-platform/protocol';
import { Z21BroadcastFlag } from '@application-platform/z21';
import { type WebSocket as WsWebSocket } from 'ws';

import { ClientMessageHandler } from '../handler/client-message-handler';
import { type ServerConfig } from '../infra/config/config';

import { createProviders, Providers } from './providers';

/**
 * Bootstrap class to initialize and start the Z21 server application.
 * Features:
 * - Loads configuration
 * - Sets up HTTP server for static file serving
 * - Initializes WebSocket server for client communication
 * - Configures Z21 UDP gateway and command service
 * - Manages locomotive and track status state
 * - Wires event handlers for Z21 events and client messages
 * - Starts the HTTP and UDP servers
 * @remarks Call `start()` to launch the server.
 */
export class Bootstrap {
	/**
	 * Validated client message handler:
	 * - Applies loco and turnout changes
	 * - Emits resulting server-to-client updates
	 * - Performs demo ping via Z21 UDP where relevant
	 */
	private readonly clientMessageHandler: ClientMessageHandler;

	/**
	 * Count of connected WebSocket clients.
	 */
	private wsClientCount = 0;

	/**
	 * Sequence number for assigning unique client IDs.
	 */
	private wsClientSeq = 0;

	/**
	 * Mapping of WebSocket client objects to their unique IDs.
	 */
	private readonly wsClientIds = new WeakMap<object, number>();

	/**
	 * Indicates whether a Z21 session is currently active.
	 */
	private z21SessionActive = false;

	/**
	 * Backing field for the Z21 heartbeat timer.
	 * Do not use directly; use `z21HeartbeatTimer` instead.
	 */
	private _z21HeartbeatTimer: NodeJS.Timeout | null = null;

	/**
	 * Timer for sending periodic Z21 heartbeat messages.
	 * @deprecated Use `z21HeartbeatTimer` instead.
	 */
	private get z21HaertbeatTimer(): NodeJS.Timeout | null {
		return this._z21HeartbeatTimer;
	}

	private set z21HaertbeatTimer(value: NodeJS.Timeout | null) {
		this._z21HeartbeatTimer = value;
	}

	private readonly providers: Providers;

	constructor(providersOrConfig: Providers | ServerConfig) {
		this.providers = 'cfg' in providersOrConfig ? providersOrConfig : createProviders(providersOrConfig);
		const broadcast = (msg: ServerToClient): void => this.providers.wsServer.broadcast(msg);
		const replay = (ws: WsWebSocket, msg: ServerToClient): void => this.providers.wsServer.sendToClient(ws, msg);
		this.clientMessageHandler = new ClientMessageHandler(
			this.providers.locoManager,
			this.providers.z21CommandService,
			this.providers.cvProgrammingService,
			replay,
			broadcast
		);
	}

	/**
	 * Start the Z21 UDP and priming requests:
	 * - Start listening on the configured UDP port
	 * - Request serial (triggers one UDP response)
	 * - Enable broadcast flags (basic + systemState)
	 * - Pull current system state immediately
	 */
	public start(): this {
		this.wireUdp();
		this.wireWs();
		this.startZ21();
		this.startHttpServer();
		return this;
	}

	/**
	 * Stops the UDP and WebSocket servers.
	 */
	public stop(): void {
		try {
			this.deactivateZ21Session();
		} catch {
			// Intentionally ignore errors during shutdown
		}

		try {
			this.providers.udp.stop();
		} catch {
			// Intentionally ignore errors during shutdown
		}

		try {
			this.providers.wsServer.close();
		} catch {
			// Intentionally ignore errors during shutdown
		}

		try {
			this.providers.httpServer.close();
		} catch {
			// Intentionally ignore errors during shutdown
		}
	}

	private wireUdp(): void {
		this.providers.udp.on('datagram', (dg) => {
			/**
			 * Dispatch inbound Z21 payloads to the handler,
			 * which may update track status and broadcast events.
			 */
			this.providers.z21EventHandler.handleDatagram(dg);
		});
	}

	private wireWs(): void {
		this.providers.wsServer.onConnection(
			/**
			 * For each accepted client message, route to the client message handler.
			 */
			(msg, ws) => this.clientMessageHandler.handle(msg, ws),
			(ws) => this.handleClientDisconnect(ws),
			(ws) => this.handleClientConnected(ws)
		);
	}

	private handleClientDisconnect(ws: unknown): void {
		const id = ws && typeof ws === 'object' ? this.getWsClientId(ws) : undefined;
		this.wsClientCount = Math.max(0, this.wsClientCount - 1);

		this.providers.logger.info('ws.client.disconnected', {
			clientId: id,
			totalClients: this.wsClientCount
		});

		if (this.wsClientCount === 0) {
			this.deactivateZ21Session();
		}

		if (!this.providers.cfg.safety.stopAllOnClientDisconnect) return;

		const stopped = this.providers.locoManager.stopAll();
		for (const { addr, state } of stopped) {
			this.providers.wsServer.broadcast({
				type: 'loco.message.state',
				addr,
				speed: 0,
				dir: state.dir,
				fns: state.fns,
				estop: state.estop
			});
		}
	}

	private handleClientConnected(ws: unknown): void {
		this.wsClientCount++;

		const id = ws && typeof ws === 'object' ? this.getWsClientId(ws) : undefined;

		this.providers.logger.info('ws.client.connected', {
			clientId: id,
			totalClients: this.wsClientCount
		});

		if (this.wsClientCount === 1) {
			this.activateZ21Session();
		}

		const addr = this.providers.cfg.dev?.subscribeLocoAddr;
		if (!addr) return;

		if (this.providers.locoManager.subscribeLocoInfoOnce(addr)) {
			this.providers.z21CommandService.getLocoInfo(addr);
		}
	}

	private startZ21(): void {
		this.providers.udp.start(this.providers.cfg.z21.listenPort ?? 21105);
	}

	private startHttpServer(): void {
		this.providers.httpServer.listen(this.providers.cfg.httpPort, () => {
			this.providers.logger.info('server.started', {
				httpPort: this.providers.cfg.httpPort,
				z21Host: this.providers.cfg.z21.host,
				z21UdpPort: this.providers.cfg.z21.udpPort,
				z21ListenPort: this.providers.cfg.z21.listenPort
			});
		});
	}

	private activateZ21Session(): void {
		if (this.z21SessionActive) return;

		this.z21SessionActive = true;
		this.providers.logger.info('z21.session.activate', {
			reason: 'first client connected',
			wsClientCount: this.wsClientCount
		});

		this.providers.csInfoOrchestrator.reset();
		this.providers.csInfoOrchestrator.poke();

		this.providers.udp.sendSetBroadcastFlags(Z21BroadcastFlag.Basic);
		this.providers.udp.sendSystemStateGetData();
		this.startZ21Heartbeat();
	}

	private deactivateZ21Session(): void {
		if (!this.z21SessionActive) return;

		this.z21SessionActive = false;
		this.providers.logger.info('z21.session.deactivate', {
			reason: 'last client disconnected',
			wsClientCount: this.wsClientCount
		});

		this.providers.csInfoOrchestrator.reset();
		this.stopZ21Heartbeat();
		this.providers.udp.sendLogOff();
	}

	private startZ21Heartbeat(): void {
		const intervalMs = 60_000;

		this.stopZ21Heartbeat();
		this.z21HaertbeatTimer = setInterval(() => {
			this.providers.udp.sendSystemStateGetData();
		}, intervalMs);

		// Don't keep the Node process alive just because of the heartbeat.
		this.z21HaertbeatTimer.unref?.();
	}

	private stopZ21Heartbeat(): void {
		if (this.z21HaertbeatTimer) {
			clearInterval(this.z21HaertbeatTimer);
			this.z21HaertbeatTimer = null;
		}
	}
	private getWsClientId(ws: object): number {
		const existing = this.wsClientIds.get(ws);
		if (existing) {
			return existing;
		}
		const id = ++this.wsClientSeq;
		this.wsClientIds.set(ws, id);
		return id;
	}
}
