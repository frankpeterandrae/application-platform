/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * Requests an emergency stop for a specific locomotive.
 */
export type LocoEStop = CommandMessage<
	'loco',
	'eStop',
	{
		addr: number;
	}
>;
