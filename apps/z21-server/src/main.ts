/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';
import path from 'node:path';

import { LocoManager, TrackStatusManager } from '@application-platform/domain';
import { createStaticFileServer, WsServer } from '@application-platform/server-utils';
import { Z21Udp } from '@application-platform/z21';

import { AppWsServer } from './app-websocket-server';
import { ClientMessageHandler } from './client-message-handler';
import { loadConfig } from './infra/config/config';
import { Z21EventHandler } from './services/z21-service';

/**
 * Loads server configuration (HTTP port, Z21 connection details, safety flags).
 */
const cfg = loadConfig();

/**
 * Z21 UDP gateway used to communicate with the digital command station.
 * @remarks Initialized with host and UDP port from configuration.
 */
const udp = new Z21Udp(cfg.z21.host, cfg.z21.udpPort);

/**
 * Manages locomotive states (speed, direction, functions).
 */
const locoManager = new LocoManager();

/**
 * Tracks power state, shorts, and emergency stop across the system.
 */
const trackStatusManager = new TrackStatusManager();

/**
 * Directory for serving static frontend assets.
 */
const publicDir = path.resolve(process.cwd(), 'public');

/**
 * HTTP server that serves static files from `publicDir`.
 */
const server = http.createServer(createStaticFileServer(publicDir));

/**
 * Application WebSocket server wrapper that handles session handshake,
 * validation, and message routing.
 */
const wsServer = new AppWsServer(new WsServer(server));

/**
 * Z21 inbound event handler:
 * - Updates track status (power/short/e-stop)
 * - Broadcasts datasets and derived events to connected clients
 */
const z21Handler = new Z21EventHandler(trackStatusManager, (msg) => wsServer.broadcast(msg));

/**
 * Validated client message handler:
 * - Applies loco and turnout changes
 * - Emits resulting server-to-client updates
 * - Performs demo ping via Z21 UDP where relevant
 */
const clientMessageHandler = new ClientMessageHandler(locoManager, udp, (msg) => wsServer.broadcast(msg));

// Connect Z21 UDP to handler
udp.on('rx', (payload) => {
	/**
	 * Dispatch inbound Z21 payloads to the handler,
	 * which may update track status and broadcast events.
	 */
	z21Handler.handle(payload);
});

// Connect WebSocket to handler
wsServer.onConnection(
	/**
	 * For each accepted client message, route to the client message handler.
	 */
	(msg) => clientMessageHandler.handle(msg),
	() => {
		// On disconnect: stop all locos if configured
		if (cfg.safety.stopAllOnClientDisconnect) {
			/**
			 * If safety requires, stop all locomotives when a client disconnects
			 * and broadcast their updated states to keep UI in sync.
			 */
			const stopped = locoManager.stopAll();
			for (const { addr, state } of stopped) {
				wsServer.broadcast({ type: 'loco.message.state', addr, speed: 0, dir: state.dir, fns: state.fns });
			}
		}
	}
);

/**
 * Start the Z21 UDP and priming requests:
 * - Start listening on the configured UDP port
 * - Request serial (triggers one UDP response)
 * - Enable broadcast flags (basic + systemState)
 * - Pull current system state immediately
 */
udp.start(21105);
udp.sendGetSerial(); // -> should trigger 1 UDP response
// Broadcasts aktivieren: basic + systemState
udp.sendSetBroadcastFlags(0x00000101);
// Initial sofort ziehen (sonst wartest du ggf. bis zur nächsten Änderung)
udp.sendSystemStateGetData();

/**
 * Start HTTP server and log bind address with Z21 connection info.
 */
server.listen(cfg.httpPort, () => {
	// eslint-disable-next-line no-console
	console.log(`[server] http://0.0.0.0:${cfg.httpPort} (Z21 ${cfg.z21.host}:${cfg.z21.udpPort})`);
});
