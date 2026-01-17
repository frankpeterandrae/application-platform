/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Reports track power state and optional fault flags.
 */
export type SystemVersion = {
	type: 'system.message.z21.version';
	version?: string;
	cmdsId?: number;
};
