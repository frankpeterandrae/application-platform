/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Direction } from '@application-platform/z21-shared';

import type { Message } from '../../message-types';

/**
 * Reports locomotive speed, direction, function states, and emergency stop status.
 */
export type LocoState = Message<
	'loco',
	'state',
	{
		addr: number;
		speed: number;
		dir: Direction;
		fns: Record<number, boolean>;
		estop: boolean;
	}
>;
