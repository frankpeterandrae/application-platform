/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

/** Direction of travel reported for a locomotive. */
export const Direction = {
	FWD: 'FWD',
	REV: 'REV'
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];
export type LocoInfoEvent = Event<Domain.LOCO, 'info', LocoInfoEventPayload>;

export type LocoInfoEventPayload = {
	addr: number;
	speedSteps: 14 | 28 | 128;
	speed: number;
	emergencyStop: boolean;
	direction: Direction;
	isMmLoco: boolean;
	isOccupied: boolean;
	isDoubleTraction: boolean;
	isSmartsearch: boolean;
	functionMap: Record<number, boolean>;
};
