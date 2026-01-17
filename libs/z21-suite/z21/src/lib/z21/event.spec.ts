/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { StatusChangedDb0 } from '../constants';

import { dataToEvent } from './event';

describe('dataToEvent', () => {
	it('emits event.system.state  with decoded payload', () => {
		const state = Uint8Array.from([0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09]);
		const events = dataToEvent({ kind: 'ds.system.state', state });

		expect(events).toEqual([
			{
				type: 'event.z21.status',
				payload: {
					mainCurrent_mA: 1,
					progCurrent_mA: 2,
					filteredMainCurrent_mA: 3,
					temperature_C: 4,
					supplyVoltage_mV: 5,
					vccVoltage_mV: 6,
					centralState: 7,
					centralStateEx: 8,
					capabilities: 9
				}
			}
		]);
	});

	it('emits event.system.state for status changed dataset', () => {
		const data = Uint8Array.from([0x62, StatusChangedDb0.CentralStatus, 0xaa]);
		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0x62, data });

		expect(events).toEqual([{ type: 'event.system.state', statusMask: 0xaa }]);
	});

	it('returns unknown.x.bus when no decoder matches', () => {
		const payload = Uint8Array.from([0xfe, 0x01, 0x02]);
		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xfe, data: payload });

		expect(events).toEqual([{ type: 'event.unknown.x.bus', xHeader: 0xfe, bytes: Array.from(payload) }]);
	});

	it('returns empty array for non-x.bus non-system datasets', () => {
		expect(dataToEvent({ kind: 'ds.unknown', header: 0x1234, payload: Buffer.from([0x01]) })).toEqual([]);
	});
});
