/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CommandMessage } from '../../message-types';

export type PomCvRead = CommandMessage<
	'programming',
	'pom.cv.read',
	{
		address: number;
		cvAdress: number;
	}
>;
