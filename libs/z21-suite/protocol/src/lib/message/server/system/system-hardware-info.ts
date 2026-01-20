/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

export type SystemHardwareInfo = Message<
	'system',
	'hardware.info',
	{
		hardwareType: string;
	}
>;
