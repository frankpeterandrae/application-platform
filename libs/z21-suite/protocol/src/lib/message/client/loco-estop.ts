/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Triggers emergency stop for a specific locomotive.
 */
export type LocoEStop = {
	type: 'loco.command.eStop';
	addr: number;
};
