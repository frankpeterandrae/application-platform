/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

export type CvRead = CommandMessage<
	'programming',
	'cv.read',
	{
		cvAdress: number;
	}
>;
