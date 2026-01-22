/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PowerPayload } from '@application-platform/z21-shared';

/**
 * Represents the current track state reported by the system, including power and fault flags.
 */
export type TrackStatus = PowerPayload & {
	/** Source of the status information, e.g., external bus or system state. */
	source?: 'ds.x.bus' | 'ds.system.state' | 'ds.lan.x';
};
