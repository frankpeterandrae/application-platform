/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

export type CvNackEventPayload = {
	/** Whether the command station reported a short circuit while programming. */
	shortCircuit: boolean;
};

export type CvNackEvent = Event<Domain.PROGRAMMING, 'cv.nack', CvNackEventPayload>;
