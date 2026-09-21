/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Forwards received Z21 datasets, derived events and the raw frame representation.
 */
export type Z21Rx = Message<
	'system',
	'z21.rx',
	{
		datasets: unknown[];
		events: unknown[];
		rawHex: string;
	}
>;
