/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import http from 'node:http';
import path from 'node:path';

import { CommandStationInfo, LocoManager } from '@application-platform/domain';
import type { ServerToClient } from '@application-platform/protocol';
import { createStaticFileServer, WsServer } from '@application-platform/server-utils';
import { Z21CommandService, Z21Udp } from '@application-platform/z21';
import { createConsoleLogger, type Logger } from '@application-platform/z21-shared';

import { Z21EventHandler } from '../handler/z21-event-handler';
import { loadConfig, type ServerConfig } from '../infra/config/config';
import { AppWsServer } from '../infra/ws/app-websocket-server';
import { CommandStationInfoOrchestrator } from '../services/command-station-info-orchestrator';
import { CvProgrammingService } from '../services/cv-programming-service';

export type Providers = {
	/**
	 * Loads server configuration (HTTP port, Z21 connection details, safety flags).
	 */
	cfg: ServerConfig;

	/**
	 * Application logger.
	 */
	logger: Logger;

	/**
	 * HTTP server that serves static files from `publicDir`.
	 */
	httpServer: http.Server;

	/**
	 * Application WebSocket server wrapper that handles session handshake,
	 * validation, and message routing.
	 */
	wsServer: AppWsServer;

	/**
	 * Z21 UDP gateway used to communicate with the digital command station.
	 */
	udp: Z21Udp;

	commandStationInfo: CommandStationInfo;

	/**
	 * Z21 service wrapper around the UDP gateway for higher-level operations.
	 */
	z21CommandService: Z21CommandService;

	/**
	 * Orchestrates command station info updates and synchronization.
	 */
	csInfoOrchestrator: CommandStationInfoOrchestrator;

	/**
	 * Manages locomotive states (speed, direction, functions).
	 */
	locoManager: LocoManager;

	/**
	 * Z21 inbound event handler:
	 * - Updates track status (power/short/e-stop)
	 * - Broadcasts datasets and derived events to connected clients
	 */
	z21EventHandler: Z21EventHandler;

	/**
	 * CV programming service for reading/writing decoder CVs.
	 */
	cvProgrammingService: CvProgrammingService;
};

/**
 * Creates all application providers/services.
 * @param cfg - Server configuration (defaults to loaded config)
 * @returns Providers object with all initialized services
 */
export function createProviders(cfg = loadConfig()): Providers {
	const logger = createConsoleLogger({
		level: cfg.dev?.logLevel ?? 'debug',
		pretty: cfg.dev?.pretty ?? true,
		context: { app: 'server' }
	});

	const publicDir = path.resolve(process.cwd(), 'public');
	const httpServer = http.createServer(createStaticFileServer(publicDir));

	const udp = new Z21Udp(cfg.z21.host, cfg.z21.udpPort, logger.child({ component: 'z21.udp' }));
	const wsServer = new AppWsServer(new WsServer(httpServer), logger.child({ component: 'ws.server' }));

	const commandStationInfo = new CommandStationInfo();

	const z21CommandService = new Z21CommandService(udp, logger.child({ component: 'z21.service' }));

	const csInfoOrchestrator = new CommandStationInfoOrchestrator(commandStationInfo, z21CommandService);
	const cvProgrammingService = new CvProgrammingService(z21CommandService, 5000);
	const locoManager = new LocoManager();

	const broadcast = (msg: ServerToClient): void => wsServer.broadcast(msg);
	const z21EventHandler = new Z21EventHandler(
		broadcast,
		locoManager,
		logger.child({ component: 'z21.handler' }),
		commandStationInfo,
		csInfoOrchestrator,
		cvProgrammingService
	);

	return {
		cfg,
		commandStationInfo,
		csInfoOrchestrator,
		cvProgrammingService,
		httpServer,
		locoManager,
		logger,
		udp,
		wsServer,
		z21CommandService,
		z21EventHandler
	};
}
