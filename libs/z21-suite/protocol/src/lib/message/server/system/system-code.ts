/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

export type SystemCode = Message<
	'system',
	'z21.code',
	{
		code: number;
	}
>;
