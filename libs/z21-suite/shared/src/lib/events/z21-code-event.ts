/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Z21CodeEvent = {
	type: 'event.z21.code';
	raw: number[];
	code: number;
};
