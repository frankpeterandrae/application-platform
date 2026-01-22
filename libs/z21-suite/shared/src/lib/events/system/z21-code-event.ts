/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

export type Z21CodeEvent = Event<
	Domain.SYSTEM,
	'z21.code',
	{
		code: number;
	}
>;
