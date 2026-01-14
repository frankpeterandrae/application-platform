/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type TrackStatus = {
	powerOn?: boolean;
	emergencyStop?: boolean;
	short?: boolean;
	source?: 'xbus' | 'systemstate';
};
