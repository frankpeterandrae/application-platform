/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Direction } from '@application-platform/z21-shared';

/**
 * Sets locomotive speed and direction with optional speed steps configuration.
 */
export type LocoDrive = {
	type: 'loco.command.drive';
	addr: number;
	speed: number;
	dir: Direction;
	steps?: 14 | 28 | 128;
};
