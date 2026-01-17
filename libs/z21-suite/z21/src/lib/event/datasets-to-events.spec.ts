/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS } from '@application-platform/z21-shared';

import { datasetsToEvents } from './datasets-to-events';

describe('datasetsToEvents', () => {
	it('emits event.system.state with decoded payload', () => {
		const state = Uint8Array.from([0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x00, 0x09]);
		const events = datasetsToEvents({ kind: 'ds.system.state', state });

		expect(events).toEqual([
			{
				type: 'event.system.state',
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

	it('emits event.z21.status for status changed dataset', () => {
		const xlan = LAN_X_COMMANDS.LAN_X_STATUS_CHANGED;
		const data = Uint8Array.from([xlan.xBusCmd, 0xaa]);
		const events = datasetsToEvents({ kind: 'ds.x.bus', xHeader: xlan.xHeader, data: data });

		expect(events).toEqual([
			{ type: 'event.z21.status', payload: { emergencyStop: false, powerOn: false, programmingMode: true, shortCircuit: false } }
		]);
	});

	it('returns empty array for unknown datasets', () => {
		const payload = Buffer.from([0x01]);
		expect(datasetsToEvents({ kind: 'ds.unknown', header: 0x1234, payload, reason: 'test reason' })).toEqual([]);
	});
});
