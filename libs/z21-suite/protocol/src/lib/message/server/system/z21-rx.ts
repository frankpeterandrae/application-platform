/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Message } from '../../message-types';

/**
 * Forwards raw Z21 datasets/events with hex payload.
 * Used for debugging or advanced integrations.
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
