/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

export const TurnoutState = {
	STRAIGHT: 'STRAIGHT',
	DIVERGING: 'DIVERGING',
	UNKNOWN: 'UNKNOWN'
};

export type TurnoutState = (typeof TurnoutState)[keyof typeof TurnoutState];

export type TurnoutInfoEventPayload = {
	addr: number;
	state: TurnoutState;
};

export type TurnoutInfoEvent = Event<Domain.SWITCHING, 'turnout.info', TurnoutInfoEventPayload>;
