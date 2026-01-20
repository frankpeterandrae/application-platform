/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type TurnoutState } from '@application-platform/z21-shared';

import type { Message } from '../../message-types';

/**
 * Reports turnout position/state.
 */
export type TurnoutState_Message = Message<
	'switching',
	'turnout.state',
	{
		addr: number;
		state: TurnoutState;
	}
>;
