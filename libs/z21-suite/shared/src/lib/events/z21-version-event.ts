/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Z21VersionEvent = {
	type: 'event.x.bus.version';
	raw: number[];
	xbusVersion: number;
	xBusVersionString: string;
	cmdsId: number;
};
