/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type PomCvRead = {
	type: 'programming.command.pom.read';
	payload: {
		address: number;
		cvAdress: number;
	};
};
