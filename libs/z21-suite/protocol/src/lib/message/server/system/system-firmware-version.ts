/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Reports track power state and optional fault flags.
 */
export type SystemFirmwareVersion = Message<
	'system',
	'firmware.version',
	{
		major: number;
		minor: number;
	}
>;
