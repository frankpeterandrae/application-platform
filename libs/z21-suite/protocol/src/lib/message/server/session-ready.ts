/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Confirms server readiness and protocol version.
 * Response to client's session.hello message.
 */
export type SessionReady = {
	type: 'server.replay.session.ready';
	protocolVersion: string;
	serverTime?: string;
};
