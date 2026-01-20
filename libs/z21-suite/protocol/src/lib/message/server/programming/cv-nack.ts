/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ReplayMessage } from '../../message-types';

export type CvNack = ReplayMessage<
	'programming',
	'cv.nack',
	{
		error: string;
	}
>;
