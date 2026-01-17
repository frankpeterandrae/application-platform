/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Toggles track power on or off.
 */
export type TrackpowerSet = {
	type: 'system.command.trackpower.set';
	on: boolean;
};
