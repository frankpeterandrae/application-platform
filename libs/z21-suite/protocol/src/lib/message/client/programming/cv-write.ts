/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

export type CvWrite = CommandMessage<
	'programming',
	'cv.write',
	{
		cvAdress: number;
		cvValue: number;
	}
>;
