/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type CvNack = {
	type: 'programming.replay.cv.nack';
	payload: {
		requestId: string;
		error: string;
	};
};
