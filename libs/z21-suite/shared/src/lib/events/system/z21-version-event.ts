/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

export type Z21VersionEvent = Event<
	Domain.SYSTEM,
	'x.bus.version',
	{
		xBusVersion: number;
		xBusVersionString: string;
		cmdsId: number;
	}
>;
