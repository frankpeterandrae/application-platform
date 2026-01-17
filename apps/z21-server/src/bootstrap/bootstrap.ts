/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';
import path from 'node:path';

import { LocoManager, TrackStatusManager } from '@application-platform/domain';
import { type ServerToClient } from '@application-platform/protocol';
import { createStaticFileServer, WsServer } from '@application-platform/server-utils';
import { Z21BroadcastFlag, Z21CommandService, Z21Udp } from '@application-platform/z21';
import { createConsoleLogger, type LogLevel } from '@application-platform/z21-shared';

import { ClientMessageHandler } from '../handler/client-message-handler';
import { Z21EventHandler } from '../handler/z21-event-handler';
import { loadConfig, type ServerConfig } from '../infra/config/config';
import { AppWsServer } from '../infra/ws/app-websocket-server';

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
	 * Loads server configuration (HTTP port, Z21 connection details, safety flags).
	 */
	private readonly cfg: ServerConfig;

	private readonly logger = createConsoleLogger({
		level: (process.env['LOG_LEVEL'] as LogLevel) ?? 'debug',
		pretty: true,
		context: { app: 'server' }
	});

	/**
	 * Directory for serving static frontend assets.
	 */
	private readonly publicDir = path.resolve(process.cwd(), 'public');

	/**
	 * HTTP server that serves static files from `publicDir`.
	 */
	private readonly httpServer = http.createServer(createStaticFileServer(this.publicDir));

	/**
	 * Application WebSocket server wrapper that handles session handshake,
	 * validation, and message routing.
	 */
	private readonly wsServer = new AppWsServer(new WsServer(this.httpServer), this.logger.child({ component: 'ws.server' }));

	/**
	 * Z21 UDP gateway used to communicate with the digital command station.
	 * @remarks Initialized with host and UDP port from configuration.
	 */
	private readonly udp: Z21Udp;

	/**
	 * Z21 service wrapper around the UDP gateway for higher-level operations.
	 * @remarks Used by the client message handler to send commands.
	 */
	private readonly z21CommandService: Z21CommandService;

	/**
	 * Manages locomotive states (speed, direction, functions).
	 */
	private readonly locoManager = new LocoManager();

	/**
	 * Tracks power state, shorts, and emergency stop across the system.
	 */
	private readonly trackStatusManager = new TrackStatusManager();

	/**
	 * Z21 inbound event handler:
	 * - Updates track status (power/short/e-stop)
	 * - Broadcasts datasets and derived events to connected clients
	 */
	private readonly z21Handler: Z21EventHandler;

	/**
	 * Validated client message handler:
	 * - Applies loco and turnout changes
	 * - Emits resulting server-to-client updates
	 * - Performs demo ping via Z21 UDP where relevant
	 */
	private readonly clientMessageHandler: ClientMessageHandler;

	constructor(cfg?: ServerConfig) {
		this.cfg = cfg ?? loadConfig();

		this.udp = new Z21Udp(this.cfg.z21.host, this.cfg.z21.udpPort, this.logger.child({ component: 'z21.udp' }));
		this.z21CommandService = new Z21CommandService(this.udp, this.logger.child({ component: 'z21.service' }));

		const broadcast = (msg: ServerToClient): void => this.wsServer.broadcast(msg);

		this.z21Handler = new Z21EventHandler(
			this.trackStatusManager,
			broadcast,
			this.locoManager,
			this.logger.child({ component: 'z21.handler' })
		);

		this.clientMessageHandler = new ClientMessageHandler(this.locoManager, this.z21CommandService, broadcast);
	}

	/**
	 * Start the Z21 UDP and priming requests:
	 * - Start listening on the configured UDP port
	 * - Request serial (triggers one UDP response)
	 * - Enable broadcast flags (basic + systemState)
	 * - Pull current system state immediately
	 */
	public start(): Bootstrap {
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
			this.udp.stop();
		} catch {
			// Intentionally ignore errors during shutdown
		}
		try {
			this.wsServer.close();
		} catch {
			// Intentionally ignore errors during shutdown
		}
		try {
			this.httpServer.close();
		} catch {
			// Intentionally ignore errors during shutdown
		}
	}

	private wireUdp(): void {
		this.udp.on('datagram', (dg) => {
			/**
			 * Dispatch inbound Z21 payloads to the handler,
			 * which may update track status and broadcast events.
			 */
			this.z21Handler.handleDatagram(dg);
		});
	}

	private wireWs(): void {
		this.wsServer.onConnection(
			/**
			 * For each accepted client message, route to the client message handler.
			 */
			(msg) => this.clientMessageHandler.handle(msg),
			() => this.handleClientDisconnect(),
			() => this.handleClientConnected()
		);
	}

	private handleClientDisconnect(): void {
		if (!this.cfg.safety.stopAllOnClientDisconnect) return;

		const stopped = this.locoManager.stopAll();
		for (const { addr, state } of stopped) {
			this.wsServer.broadcast({
				type: 'loco.message.state',
				addr,
				speed: 0,
				dir: state.dir,
				fns: state.fns,
				estop: state.estop
			});
		}
	}

	private handleClientConnected(): void {
		const addr = this.cfg.dev?.subscribeLocoAddr;
		if (!addr) return;

		if (this.locoManager.subscribeLocoInfoOnce(addr)) {
			this.z21CommandService.getLocoInfo(addr);
		}
	}

	private startZ21(): void {
		this.udp.start(this.cfg.z21.listenPort ?? 21105);

		this.udp.sendGetSerial();
		this.udp.sendSetBroadcastFlags(Z21BroadcastFlag.Basic);
		this.udp.sendSystemStateGetData();
	}

	private startHttpServer(): void {
		this.httpServer.listen(this.cfg.httpPort, () => {
			this.logger.info('server.started', {
				httpPort: this.cfg.httpPort,
				z21Host: this.cfg.z21.host,
				z21UdpPort: this.cfg.z21.udpPort,
				z21ListenPort: this.cfg.z21.listenPort
			});
		});
	}
}
