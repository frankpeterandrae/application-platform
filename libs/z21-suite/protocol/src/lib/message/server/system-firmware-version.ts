/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Reports track power state and optional fault flags.
 */
export type SystemFirmwareVersion = {
	type: 'system.message.firmware.version';
	major?: number;
	minor?: number;
};
