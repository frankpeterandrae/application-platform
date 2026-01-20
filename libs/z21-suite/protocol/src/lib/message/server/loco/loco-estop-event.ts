/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Notifies that a locomotive has entered emergency stop state.
 */
export type LocoEStopEvent = Message<
	'loco',
	'eStop',
	{
		addr: number;
	}
>;
