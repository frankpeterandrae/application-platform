/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LogLevel } from '../logging/logger';

import { Broadcastflags } from './constants';

/**
 * Server configuration shape loaded from config.json or environment.
 * - httpPort: HTTP server listening port
 * - z21: Z21 central host and UDP port
 * - safety: runtime safety features
 */
export type ServerConfig = {
	dev?: { subscribeLocoAddr?: number; logLevel?: LogLevel; pretty?: boolean };
	httpPort: number;
	z21: {
		host: string;
		udpPort: number;
		listenPort?: number;
		debug?: boolean;
		broadcastflags?: Broadcastflags;
	};
	safety: { stopAllOnClientDisconnect: boolean };
};
