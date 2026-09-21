/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { HardwareType } from '@application-platform/z21-shared';

import type { Message } from '../../message-types';

/**
 * Reports the detected command station hardware type.
 */
export type SystemHardwareInfo = Message<
	'system',
	'hardware.info',
	{
		hardwareType: HardwareType | 'UNKNOWN';
	}
>;
