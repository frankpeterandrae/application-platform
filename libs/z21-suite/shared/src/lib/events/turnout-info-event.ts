/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export const TurnoutState = {
	STRAIGHT: 'STRAIGHT',
	DIVERGING: 'DIVERGING',
	UNKNOWN: 'UNKNOWN'
};

export type TurnoutState = (typeof TurnoutState)[keyof typeof TurnoutState];

export type TurnoutInfoEvent = { type: 'event.turnout.info'; addr: number; state: TurnoutState };
