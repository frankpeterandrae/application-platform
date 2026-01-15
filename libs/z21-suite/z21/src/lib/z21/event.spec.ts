/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import {
	AddessByteMask,
	F13ToF20FunctionsByteMask,
	F21ToF28FunctionsByteMask,
	F29ToF31FunctionsByteMask,
	F5ToF12FunctionsByteMask,
	InfoByteMask,
	LowFunctionsByteMask,
	SpeedByteMask,
	StatusChangedDb0,
	TrackPowerBroadcastValue,
	XBusHeader
} from '../constants';

import { dataToEvent, deriveTrackFlagsFromSystemState } from './event';

describe('dataToEvent', () => {
	it('emits system.state event with decoded payload', () => {
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

	it('emits event.track.power off when broadcast indicates off', () => {
		const events = dataToEvent({
			kind: 'ds.x.bus',
			xHeader: XBusHeader.TrackPowerBroadcast,
			data: Uint8Array.from([XBusHeader.TrackPowerBroadcast, TrackPowerBroadcastValue.Off])
		});
		expect(events).toEqual([{ type: 'event.track.power', on: false }]);
	});

	it('emits event.track.power on when broadcast indicates on', () => {
		const events = dataToEvent({
			kind: 'ds.x.bus',
			xHeader: XBusHeader.TrackPowerBroadcast,
			data: Uint8Array.from([XBusHeader.TrackPowerBroadcast, TrackPowerBroadcastValue.On])
		});
		expect(events).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('emits event.system.state when status changed dataset received', () => {
		const events = dataToEvent({
			kind: 'ds.x.bus',
			xHeader: XBusHeader.StatusChanged,
			data: Uint8Array.from([XBusHeader.StatusChanged, StatusChangedDb0.CentralStatus, 0xaa])
		});
		expect(events).toEqual([{ type: 'event.system.state', statusMask: 0xaa }]);
	});

	it('emits loco.info with parsed address, speed and function map', () => {
		const addrMsb = 0x03 & AddessByteMask.MSB;
		const addrLsb = 0x39;
		const db2 = InfoByteMask.OCCUPIED | (2 as const); // speedStepCode 2 -> 28
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x14;
		const db4 = LowFunctionsByteMask.L | LowFunctionsByteMask.F1 | LowFunctionsByteMask.S;
		const db5 = F5ToF12FunctionsByteMask.F5 | F5ToF12FunctionsByteMask.F7;
		const data = Uint8Array.from([XBusHeader.LocoInfo, addrMsb, addrLsb, db2, db3, db4, db5]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: XBusHeader.LocoInfo, data });

		expect(events).toEqual([
			{
				type: 'event.loco.info',
				addr: (addrMsb << 8) + addrLsb,
				isMmLoco: false,
				isOccupied: true,
				isDoubleTraction: false,
				isSmartsearch: true,
				speedSteps: 28,
				speedRaw: 0x14 & SpeedByteMask.VALUE,
				forward: true,
				functionMap: {
					0: true,
					1: true,
					2: false,
					3: false,
					4: false,
					5: true,
					6: false,
					7: true,
					8: false,
					9: false,
					10: false,
					11: false,
					12: false
				}
			}
		]);
	});

	it('emits loco.info with extended function bytes (f13..f31) included', () => {
		const addrMsb = 0x01 & AddessByteMask.MSB;
		const addrLsb = 0x02;
		const db2 = 0; // no occupied flag, speedSteps default
		const db3 = 0x05; // reverse, small speed
		const db4 = 0x00; // low functions none
		// set some bits in db5..db8 to enable functions 5,9,13,20,25,29,31
		const db5 = F5ToF12FunctionsByteMask.F5 | F5ToF12FunctionsByteMask.F9; // f5, f9
		const db6 = F13ToF20FunctionsByteMask.F13 | F13ToF20FunctionsByteMask.F20; // f13, f20
		const db7 = F21ToF28FunctionsByteMask.F25; // f25
		const db8 = F29ToF31FunctionsByteMask.F29 | F29ToF31FunctionsByteMask.F31; // f29, f31

		const data = Uint8Array.from([XBusHeader.LocoInfo, addrMsb, addrLsb, db2, db3, db4, db5, db6, db7, db8]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: XBusHeader.LocoInfo, data });
		expect(events).toHaveLength(1);
		const ev = events[0] as any;
		expect(ev.type).toBe('event.loco.info');
		expect(ev.addr).toBe((addrMsb << 8) + addrLsb);
		// check a selection of function bits were decoded correctly
		expect(ev.functionMap[5]).toBe(true);
		expect(ev.functionMap[9]).toBe(true);
		expect(ev.functionMap[13]).toBe(true);
		expect(ev.functionMap[20]).toBe(true);
		expect(ev.functionMap[25]).toBe(true);
		expect(ev.functionMap[29]).toBe(true);
		expect(ev.functionMap[31]).toBe(true);
		// some functions that were not set should be false/undefined
		expect(ev.functionMap[6]).toBe(false);
		expect(ev.functionMap[14]).toBe(false);
		expect(ev.functionMap[30]).toBe(false);
	});

	it('returns empty array for non-x.bus non-system datasets', () => {
		expect(dataToEvent({ kind: 'ds.unknown', header: 0x1234, payload: Buffer.from([0x01]) })).toEqual([]);
	});

	it('emits unknown.x.bus for unhandled x.bus header', () => {
		const payload = Uint8Array.from([0xfe, 0x01, 0x02]);
		expect(dataToEvent({ kind: 'ds.x.bus', xHeader: 0xfe, data: payload })).toEqual([
			{ type: 'event.unknown.x.bus', xHeader: 0xfe, bytes: Array.from(payload) }
		]);
	});

	it('returns unknown.x.bus for loco.info payload shorter than 6 bytes', () => {
		const payload = Uint8Array.from([XBusHeader.LocoInfo, 0x00, 0x01]);
		expect(dataToEvent({ kind: 'ds.x.bus', xHeader: XBusHeader.LocoInfo, data: payload })).toEqual([
			{ type: 'event.unknown.x.bus', xHeader: XBusHeader.LocoInfo, bytes: Array.from(payload) }
		]);
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
});
