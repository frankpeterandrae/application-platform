/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PowerPayload } from '@application-platform/z21-shared';

/**
 * Identifies the protocol source that produced a track status update.
 */
export type TrackStatusSource = 'ds.x.bus' | 'ds.system.state' | 'ds.lan.x';

/**
 * Represents the current track power and fault state.
 */
export type TrackStatus = PowerPayload & {
	/**
	 * Protocol source of the most recent status update.
	 */
	source?: TrackStatusSource;
};
