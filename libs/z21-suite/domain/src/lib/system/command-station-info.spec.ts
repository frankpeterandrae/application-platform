/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';

import { CommandStationInfo, type CommandStationVersion } from './command-station-info';

describe('CommandStationInfo', () => {
	it('initially has no version', () => {
		const cs = new CommandStationInfo();
		expect(cs.getVersion()).toBeUndefined();
		expect(cs.hasVersion()).toBe(false);
	});

	it('can store and retrieve version information', () => {
		const cs = new CommandStationInfo();
		const v: CommandStationVersion = { xbusVersion: 0x21, versionString: 'V2.1', cmdsId: 2, raw: [0x21, 2] };
		cs.setVersion(v);
		expect(cs.hasVersion()).toBe(true);
		expect(cs.getVersion()).toEqual(v);
	});

	it('overwrites previous version when setVersion is called again', () => {
		const cs = new CommandStationInfo();
		cs.setVersion({ xbusVersion: 1, versionString: 'V1.0', cmdsId: 1 });
		expect(cs.getVersion()).toMatchObject({ versionString: 'V1.0' });

		cs.setVersion({ xbusVersion: 2, versionString: 'V2.0', cmdsId: 2 });
		expect(cs.getVersion()).toMatchObject({ versionString: 'V2.0' });
	});

	it('accepts an empty CommandStationVersion object and reports hasVersion', () => {
		const cs = new CommandStationInfo();
		cs.setVersion({});
		expect(cs.hasVersion()).toBe(true);
		expect(cs.getVersion()).toEqual({});
	});
});
