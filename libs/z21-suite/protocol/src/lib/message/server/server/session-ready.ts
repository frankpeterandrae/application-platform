/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ReplayMessage } from '../../message-types';

/**
 * Confirms server readiness and protocol version.
 * Response to client's server.command.session.hello message.
 */
export type SessionReady = ReplayMessage<
	'server',
	'session.ready',
	{
		protocolVersion: string;
		serverTime?: string;
	}
>;
