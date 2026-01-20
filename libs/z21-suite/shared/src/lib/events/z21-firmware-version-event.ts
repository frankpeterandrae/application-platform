/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Z21FirmwareVersionEvent = {
	type: 'event.z21.firmware.version';
	raw: number[];
	major: number;
	minor: number;
};
