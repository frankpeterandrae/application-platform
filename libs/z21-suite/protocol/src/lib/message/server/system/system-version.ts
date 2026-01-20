/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Reports track power state and optional fault flags.
 */
export type SystemVersion = Message<
	'system',
	'x.bus.version',
	{
		version: string;
		cmdsId: number;
	}
>;
