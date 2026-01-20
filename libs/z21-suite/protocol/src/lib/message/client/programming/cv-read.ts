/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type CvRead = {
	type: 'programming.command.cv.read';
	payload: {
		cvAdress: number;
		requestId: string;
	};
};
