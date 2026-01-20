/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Direction } from '@application-platform/z21-shared';

import type { CommandMessage } from '../../message-types';

/**
 * Sets locomotive speed and direction with optional speed steps configuration.
 */
export type LocoDrive = CommandMessage<
	'loco',
	'drive',
	{
		addr: number;
		speed: number;
		dir: Direction;
		steps?: 14 | 28 | 128;
	}
>;
