/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Represents the current track state reported by the system, including power and fault flags.
 */
export type TrackStatus = {
	/** Indicates whether track power is currently enabled. */
	powerOn?: boolean;
	/** Signals an emergency stop condition. */
	emergencyStop?: boolean;
	/** Signals a short-circuit condition. */
	short?: boolean;
	/** Indicates whether the track is in programming mode. */
	programmingMode?: boolean;
	/** Source of the status information, e.g., external bus or system state. */
	source?: 'ds.x.bus' | 'ds.system.state';
};
