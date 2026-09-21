/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Reports the X-Bus version and command station identifier.
 */
export type SystemVersion = Message<
	'system',
	'x.bus.version',
	{
		version: string;
		cmdsId: number;
	}
>;
