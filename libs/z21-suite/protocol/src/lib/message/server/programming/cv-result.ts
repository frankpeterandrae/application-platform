/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ReplayMessage } from '../../message-types';

export type CvResult = ReplayMessage<
	'programming',
	'cv.result',
	{
		cvAdress: number;
		cvValue: number;
	}
>;
