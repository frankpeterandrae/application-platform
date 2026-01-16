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
	StatusChangedDb0
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
			xHeader: 0x61,
			data: Uint8Array.from([0x61, 0x00])
		});
		expect(events).toEqual([{ type: 'event.track.power', on: false }]);
	});

	it('emits event.track.power on when broadcast indicates on', () => {
		const events = dataToEvent({
			kind: 'ds.x.bus',
			xHeader: 0x61,
			data: Uint8Array.from([0x61, 0x01])
		});
		expect(events).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('emits event.system.state when status changed dataset received', () => {
		const events = dataToEvent({
			kind: 'ds.x.bus',
			xHeader: 0x62,
			data: Uint8Array.from([0x62, StatusChangedDb0.CentralStatus, 0xaa])
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
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

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

		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5, db6, db7, db8]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });
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

	it('emits event.unknown.x.bus for unhandled x.bus header', () => {
		const payload = Uint8Array.from([0xfe, 0x01, 0x02]);
		expect(dataToEvent({ kind: 'ds.x.bus', xHeader: 0xfe, data: payload })).toEqual([
			{ type: 'event.unknown.x.bus', xHeader: 0xfe, bytes: Array.from(payload) }
		]);
	});

	it('returns event.unknown.x.bus for loco.info payload shorter than 6 bytes', () => {
		const payload = Uint8Array.from([0xef, 0x00, 0x01]);
		expect(dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data: payload })).toEqual([
			{ type: 'event.unknown.x.bus', xHeader: 0xef, bytes: Array.from(payload) }
		]);
	});
	it('emits turnout.info with STRAIGHT state', () => {
		const addrMsb = 0x01 & AddessByteMask.MSB;
		const addrLsb = 0x10;
		const zz = 0x01;
		const data = Uint8Array.from([0x43, addrMsb, addrLsb, zz]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0x43, data });

		expect(events).toEqual([
			{
				type: 'event.turnout.info',
				addr: (addrMsb << 8) + addrLsb,
				state: 'STRAIGHT'
			}
		]);
	});

	it('emits turnout.info with DIVERGING state', () => {
		const addrMsb = 0x02 & AddessByteMask.MSB;
		const addrLsb = 0x20;
		const zz = 0x02;
		const data = Uint8Array.from([0x43, addrMsb, addrLsb, zz]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0x43, data });

		expect(events).toEqual([
			{
				type: 'event.turnout.info',
				addr: (addrMsb << 8) + addrLsb,
				state: 'DIVERGING'
			}
		]);
	});

	it('emits turnout.info with UNKNOWN state for invalid zz value', () => {
		const addrMsb = 0x03 & AddessByteMask.MSB;
		const addrLsb = 0x30;
		const zz = 0x00;
		const data = Uint8Array.from([0x43, addrMsb, addrLsb, zz]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0x43, data });

		expect(events).toEqual([
			{
				type: 'event.turnout.info',
				addr: (addrMsb << 8) + addrLsb,
				state: 'UNKNOWN'
			}
		]);
	});

	it('returns event.unknown.x.bus for turnout.info payload shorter than 4 bytes', () => {
		const payload = Uint8Array.from([0x43, 0x00]);
		expect(dataToEvent({ kind: 'ds.x.bus', xHeader: 0x43, data: payload })).toEqual([
			{ type: 'event.unknown.x.bus', xHeader: 0x43, bytes: Array.from(payload) }
		]);
	});

	it('emits loco.info with 14 speed steps', () => {
		const addrMsb = 0x01 & AddessByteMask.MSB;
		const addrLsb = 0x05;
		const db2 = 0;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x0a;
		const db4 = 0x00;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events).toEqual([
			{
				type: 'event.loco.info',
				addr: (addrMsb << 8) + addrLsb,
				isMmLoco: false,
				isOccupied: false,
				isDoubleTraction: false,
				isSmartsearch: false,
				speedSteps: 14,
				speedRaw: 0x0a & SpeedByteMask.VALUE,
				forward: true,
				functionMap: {
					0: false,
					1: false,
					2: false,
					3: false,
					4: false
				}
			}
		]);
	});

	it('emits loco.info with 128 speed steps', () => {
		const addrMsb = 0x05 & AddessByteMask.MSB;
		const addrLsb = 0x64;
		const db2 = 4;
		const db3 = 0x40;
		const db4 = LowFunctionsByteMask.F4;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events).toEqual([
			{
				type: 'event.loco.info',
				addr: (addrMsb << 8) + addrLsb,
				isMmLoco: false,
				isOccupied: false,
				isDoubleTraction: false,
				isSmartsearch: false,
				speedSteps: 128,
				speedRaw: 0x40,
				forward: false,
				functionMap: {
					0: false,
					1: false,
					2: false,
					3: false,
					4: true
				}
			}
		]);
	});

	it('emits loco.info with MM loco flag set', () => {
		const addrMsb = 0x10 & AddessByteMask.MSB;
		const addrLsb = 0xaa;
		const db2 = InfoByteMask.MM_LOCO | 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x05;
		const db4 = 0x00;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			isMmLoco: true,
			speedSteps: 28
		});
	});

	it('emits loco.info with double traction flag set', () => {
		const addrMsb = 0x01 & AddessByteMask.MSB;
		const addrLsb = 0x02;
		const db2 = 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x10;
		const db4 = LowFunctionsByteMask.D;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			isDoubleTraction: true
		});
	});

	it('emits loco.info with all functions F0-F12 set', () => {
		const addrMsb = 0x02 & AddessByteMask.MSB;
		const addrLsb = 0x03;
		const db2 = 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x15;
		const db4 = 0xff;
		const db5 = 0xff;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			functionMap: {
				0: true,
				1: true,
				2: true,
				3: true,
				4: true,
				5: true,
				6: true,
				7: true,
				8: true,
				9: true,
				10: true,
				11: true,
				12: true
			}
		});
	});

	it('emits loco.info with F13-F20 functions', () => {
		const addrMsb = 0x03 & AddessByteMask.MSB;
		const addrLsb = 0x10;
		const db2 = 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x20;
		const db4 = 0x00;
		const db5 = 0x00;
		const db6 = 0xaa;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5, db6]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			functionMap: {
				13: false,
				14: true,
				15: false,
				16: true,
				17: false,
				18: true,
				19: false,
				20: true
			}
		});
	});

	it('emits loco.info with F21-F28 functions', () => {
		const addrMsb = 0x04 & AddessByteMask.MSB;
		const addrLsb = 0x20;
		const db2 = 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x30;
		const db4 = 0x00;
		const db5 = 0x00;
		const db6 = 0x00;
		const db7 = 0x55;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5, db6, db7]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			functionMap: {
				21: true,
				22: false,
				23: true,
				24: false,
				25: true,
				26: false,
				27: true,
				28: false
			}
		});
	});

	it('emits loco.info with F29-F31 functions', () => {
		const addrMsb = 0x05 & AddessByteMask.MSB;
		const addrLsb = 0x30;
		const db2 = 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x40;
		const db4 = 0x00;
		const db5 = 0x00;
		const db6 = 0x00;
		const db7 = 0x00;
		const db8 = 0x07;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5, db6, db7, db8]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			functionMap: {
				29: true,
				30: true,
				31: true
			}
		});
	});

	it('emits loco.info with all function bytes present and mixed values', () => {
		const addrMsb = 0x06 & AddessByteMask.MSB;
		const addrLsb = 0x40;
		const db2 = 2;
		const db3 = 0x50;
		const db4 = 0x11;
		const db5 = 0x22;
		const db6 = 0x44;
		const db7 = 0x88;
		const db8 = 0x03;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4, db5, db6, db7, db8]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			forward: false,
			speedRaw: 0x50,
			functionMap: {
				0: true,
				1: true,
				2: false,
				3: false,
				4: false,
				5: false,
				6: true,
				7: false,
				8: false,
				9: false,
				10: true,
				11: false,
				12: false,
				13: false,
				14: false,
				15: true,
				16: false,
				17: false,
				18: false,
				19: true,
				20: false,
				21: false,
				22: false,
				23: false,
				24: true,
				25: false,
				26: false,
				27: false,
				28: true,
				29: true,
				30: true,
				31: false
			}
		});
	});

	it('emits loco.info with max address value', () => {
		const addrMsb = AddessByteMask.MSB;
		const addrLsb = 0xff;
		const db2 = 2;
		const db3 = SpeedByteMask.DIRECTION_FORWARD | 0x7f;
		const db4 = 0x00;
		const data = Uint8Array.from([0xef, addrMsb, addrLsb, db2, db3, db4]);

		const events = dataToEvent({ kind: 'ds.x.bus', xHeader: 0xef, data });

		expect(events[0]).toMatchObject({
			type: 'event.loco.info',
			addr: (addrMsb << 8) + addrLsb,
			speedRaw: 0x7f
		});
	});

	it('emits system.state with negative current values', () => {
		const state = Uint8Array.from([0xff, 0xff, 0xfe, 0xff, 0xfd, 0xff, 0xfc, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
		const events = dataToEvent({ kind: 'ds.system.state', state });

		expect(events[0]).toMatchObject({
			type: 'event.z21.status',
			payload: {
				mainCurrent_mA: -1,
				progCurrent_mA: -2,
				filteredMainCurrent_mA: -3,
				temperature_C: -4
			}
		});
	});

	it('emits system.state with maximum positive values', () => {
		const state = Uint8Array.from([0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0xff]);
		const events = dataToEvent({ kind: 'ds.system.state', state });

		expect(events[0]).toMatchObject({
			type: 'event.z21.status',
			payload: {
				mainCurrent_mA: 32767,
				progCurrent_mA: 32767,
				filteredMainCurrent_mA: 32767,
				temperature_C: 32767,
				supplyVoltage_mV: 65535,
				vccVoltage_mV: 65535,
				centralState: 0xff,
				centralStateEx: 0xff,
				capabilities: 0xff
			}
		});
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
