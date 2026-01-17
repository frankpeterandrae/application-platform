/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Notifies that a locomotive has entered emergency stop state.
 */
export type LocoEStopEvent = {
	type: 'loco.message.eStop';
	addr: number;
};
