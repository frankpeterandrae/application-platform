/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

/**
 * Toggles a locomotive function between on and off states.
 */
export type LocoFunctionToggle = CommandMessage<
	'loco',
	'function.toggle',
	{
		addr: number;
		fn: number;
	}
>;
