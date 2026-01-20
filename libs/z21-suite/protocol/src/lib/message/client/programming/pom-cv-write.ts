/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type PomCvWrite = {
	type: 'programming.command.pom.write';
	payload: {
		adress: number;
		cvAddress: number;
		cvValue: number;
	};
};
