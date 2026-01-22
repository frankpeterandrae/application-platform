/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Domain } from '../../types';
import { Event } from '../event';

export type CvResultPayload = {
	/** 1-based CV: CV1 => 1 */
	cv: number;
	/** 0..255 */
	value: number;
};

export type CvResultEvent = Event<Domain.PROGRAMMING, 'cv.result', CvResultPayload>;
