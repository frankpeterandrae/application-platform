/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

export type PomCvWrite = CommandMessage<
	'programming',
	'pom.cv.write',
	{
		address: number;
		cvAddress: number;
		cvValue: number;
	}
>;
