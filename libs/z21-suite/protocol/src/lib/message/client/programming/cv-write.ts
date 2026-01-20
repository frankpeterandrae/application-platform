/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type CvWrite = {
	type: 'programming.command.cv.write';
	payload: {
		cvAdress: number;
		cvValue: number;
		requestId: string;
	};
};
