/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type TrackPowerEvent = {
	type: 'event.track.power';
	on: boolean;
	emergencyStop?: boolean;
	programmingMode?: boolean;
	shortCircuit?: boolean;
};
