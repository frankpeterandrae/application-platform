/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Z21VersionEvent = {
	type: 'event.z21.x.bus.version';
	raw: number[];
	xBusVersion: number;
	xBusVersionString: string;
	cmdsId: number;
};
