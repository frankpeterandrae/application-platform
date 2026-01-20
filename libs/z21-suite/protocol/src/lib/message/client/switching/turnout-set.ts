/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type TurnoutState } from '@application-platform/z21-shared';

import type { CommandMessage } from '../../message-types';

/**
 * Changes a turnout state with optional pulse duration in milliseconds.
 */
export type TurnoutSet = CommandMessage<
	'switching',
	'turnout.set',
	{
		addr: number;
		state: TurnoutState;
		pulseMs?: number;
	}
>;
