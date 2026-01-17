/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Cardinal direction a locomotive can travel.
 * 'FWD' denotes direction; 'REV' denotes reverse.
 */
export const Direction = {
	FWD: 'FWD',
	REV: 'REV'
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];
export type LocoInfoEvent = {
	type: 'event.loco.info';
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
