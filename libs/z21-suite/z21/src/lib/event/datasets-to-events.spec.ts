/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS, Z21LanHeader } from '@application-platform/z21-shared';

import { datasetsToEvents } from './datasets-to-events';

describe('datasetsToEvents', () => {
	it('emits event.system.state  with decoded payload', () => {
		const state = Uint8Array.from([0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09]);
		const events = datasetsToEvents({ kind: 'ds.system.state', state });

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
		const xlan = LAN_X_COMMANDS.LAN_X_STATUS_CHANGED;
		const data = Uint8Array.from([xlan.lanHeader, xlan.xBusHeader, xlan.xBusCmd, 0xaa]);
		const events = datasetsToEvents({ kind: 'ds.x.bus', xHeader: Z21LanHeader.LAN_X, data: data });

		expect(events).toEqual([{ type: 'event.system.state', statusMask: 0xaa }]);
	});

	it('returns unknown.x.bus when no decoder matches', () => {
		const payload = Uint8Array.from([0xfe, 0x01, 0x02]);
		const events = datasetsToEvents({ kind: 'ds.x.bus', xHeader: 0xfe, data: payload });

		expect(events).toEqual([{ type: 'event.unknown.x.bus', xHeader: 0xfe, bytes: Array.from(payload) }]);
	});

	it('returns empty array for non-x.bus non-system datasets', () => {
		expect(datasetsToEvents({ kind: 'ds.unknown', header: 0x1234, payload: Buffer.from([0x01]) })).toEqual([]);
	});
});
