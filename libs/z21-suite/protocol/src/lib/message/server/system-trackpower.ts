/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Reports track power state and optional fault flags.
 */
export type SystemTrackPower = {
	type: 'system.message.trackpower';
	on: boolean;
	short?: boolean;
	emergencyStop?: boolean;
};
