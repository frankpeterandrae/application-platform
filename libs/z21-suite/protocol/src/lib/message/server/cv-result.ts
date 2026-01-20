/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type CvResult = {
	type: 'programming.replay.cv.result';
	payload: {
		requestId: string;
		cvAdress: number;
		cvValue: number;
	};
};
