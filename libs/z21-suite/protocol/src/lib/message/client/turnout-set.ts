/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TurnoutState } from '@application-platform/z21-shared';

/**
 * Changes a turnout state with optional pulse duration in milliseconds.
 */
export type TurnoutSet = {
	type: 'switching.command.turnout.set';
	addr: number;
	state: TurnoutState;
	pulseMs?: number;
};
