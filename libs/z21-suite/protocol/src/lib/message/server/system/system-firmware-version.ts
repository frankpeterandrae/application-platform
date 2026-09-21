/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Reports the firmware version of the connected command station.
 */
export type SystemFirmwareVersion = Message<
	'system',
	'firmware.version',
	{
		major: number;
		minor: number;
	}
>;
