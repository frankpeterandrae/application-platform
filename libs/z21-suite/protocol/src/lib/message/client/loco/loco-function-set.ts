/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * Sets a locomotive function to a specific state (on/off).
 */
export type LocoFunctionSet = CommandMessage<
	'loco',
	'function.set',
	{
		addr: number;
		fn: number;
		on: boolean;
	}
>;
