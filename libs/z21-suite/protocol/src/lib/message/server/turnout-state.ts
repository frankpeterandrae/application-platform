/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TurnoutState } from '@application-platform/z21-shared';

/**
 * Reports turnout position/state.
 */
export type TurnoutState_Message = {
	type: 'switching.message.turnout.state';
	addr: number;
	state: TurnoutState;
};
