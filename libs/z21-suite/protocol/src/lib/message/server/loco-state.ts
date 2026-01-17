/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Direction } from '@application-platform/z21-shared';

/**
 * Reports locomotive speed, direction, function states, and emergency stop status.
 */
export type LocoState = {
	type: 'loco.message.state';
	addr: number;
	speed: number;
	dir: Direction;
	fns: Record<number, boolean>;
	estop?: boolean;
};
