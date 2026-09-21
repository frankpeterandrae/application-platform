/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ReplayMessage } from '../../message-types';

/**
 * Confirms server readiness and reports the active protocol version.
 */
export type SessionReady = ReplayMessage<
	'server',
	'session.ready',
	{
		protocolVersion: string;
		serverTime?: string;
	}
>;
