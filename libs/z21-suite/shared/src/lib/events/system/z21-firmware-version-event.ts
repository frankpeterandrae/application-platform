/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

export type Z21FirmwareVersionEvent = Event<
	Domain.SYSTEM,
	'firmware.version',
	{
		major: number;
		minor: number;
	}
>;
