/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Reports track power state and optional fault flags.
 */
export type SystemTrackPower = Message<
	'system',
	'trackpower',
	{
		on: boolean;
		short?: boolean;
		emergencyStop?: boolean;
	}
>;
