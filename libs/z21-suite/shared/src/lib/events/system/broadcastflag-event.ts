/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Broadcastflags, Domain } from '../../types';
import { Event } from '../event';

export type BroadcastflagEvent = Event<
	Domain.SYSTEM,
	'broadcastflag',
	{
		flags: Broadcastflags;
		raw: number[];
	}
>;
