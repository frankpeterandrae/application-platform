/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { StatusChangedDb0 } from '../constants';

import { dataToEvent, deriveTrackFlagsFromSystemState } from './event';

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

describe('deriveTrackFlagsFromSystemState', () => {
	it('sets powerOn when track voltage is on', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x00 });
		expect(flags.powerOn).toBe(true);
		expect(flags.emergencyStop).toBe(false);
		expect(flags.short).toBe(false);
		expect(flags.programmingMode).toBe(false);
	});

	it('detects emergency stop and short circuit', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x06, centralStateEx: 0x00 });
		expect(flags.powerOn).toBe(false);
		expect(flags.emergencyStop).toBe(false);
		expect(flags.short).toBe(true);
	});

	it('detects emergency stop flag when set', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x01, centralStateEx: 0x00 });
		expect(flags.emergencyStop).toBe(true);
		expect(flags.powerOn).toBe(true);
		expect(flags.short).toBe(false);
	});

	it('detects programming mode active', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x20, centralStateEx: 0x00 });
		expect(flags.programmingMode).toBe(true);
	});

	it('sets powerOff when track voltage flag is present', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x02, centralStateEx: 0x00 });
		expect(flags.powerOn).toBe(false);
		expect(flags.emergencyStop).toBe(false);
		expect(flags.short).toBe(false);
	});

	it('detects high temperature flag', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x01 });
		expect(flags.highTemperature).toBe(true);
		expect(flags.powerLost).toBe(false);
		expect(flags.shortCircuitExternal).toBe(false);
		expect(flags.shortCircuitInternal).toBe(false);
	});

	it('detects power lost flag', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x02 });
		expect(flags.powerLost).toBe(true);
		expect(flags.highTemperature).toBe(false);
	});

	it('detects external short circuit flag', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x04 });
		expect(flags.shortCircuitExternal).toBe(true);
		expect(flags.shortCircuitInternal).toBe(false);
	});

	it('detects internal short circuit flag', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x08 });
		expect(flags.shortCircuitInternal).toBe(true);
		expect(flags.shortCircuitExternal).toBe(false);
	});

	it('detects CSE RCN-213 mode flag', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x20 });
		expect(flags.cseRCN2130Mode).toBe(true);
	});

	it('detects multiple central status flags simultaneously', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x07, centralStateEx: 0x00 });
		expect(flags.emergencyStop).toBe(true);
		expect(flags.powerOn).toBe(false);
		expect(flags.short).toBe(true);
	});

	it('detects multiple extended status flags simultaneously', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x00, centralStateEx: 0x0f });
		expect(flags.highTemperature).toBe(true);
		expect(flags.powerLost).toBe(true);
		expect(flags.shortCircuitExternal).toBe(true);
		expect(flags.shortCircuitInternal).toBe(true);
	});

	it('detects all central and extended status flags combined', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x27, centralStateEx: 0x2f });
		expect(flags.emergencyStop).toBe(true);
		expect(flags.powerOn).toBe(false);
		expect(flags.short).toBe(true);
		expect(flags.programmingMode).toBe(true);
		expect(flags.highTemperature).toBe(true);
		expect(flags.powerLost).toBe(true);
		expect(flags.shortCircuitExternal).toBe(true);
		expect(flags.shortCircuitInternal).toBe(true);
		expect(flags.cseRCN2130Mode).toBe(true);
	});
});
