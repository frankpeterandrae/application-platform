/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Z21VersionEvent = {
	type: 'event.z21.version';
	raw: number[];
	xbusVersion: number;
	versionString: string;
	cmdsId: number;
};
