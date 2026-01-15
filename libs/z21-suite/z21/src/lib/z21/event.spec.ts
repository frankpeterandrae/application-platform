/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { dataToEvent, deriveTrackFlagsFromSystemState } from './event';

describe('deriveTrackFlagsFromSystemState', () => {
	it('derives flags from centralState bitfield', () => {
		const cs = 0x01 | 0x04 | 0x20; // EmergencyStop, ShortCircuit, ProgrammingModeActive
		const flags = deriveTrackFlagsFromSystemState({ centralState: cs, centralStateEx: 0x00 });
		expect(flags.emergencyStop).toBe(true);
		expect(flags.short).toBe(true);
		expect(flags.programmingMode).toBe(true);
		// TrackVoltageOff not set -> powerOn true
		expect(flags.powerOn).toBe(true);
	});

	it('reports powerOff when TrackVoltageOff bit set', () => {
		const flags = deriveTrackFlagsFromSystemState({ centralState: 0x02, centralStateEx: 0x00 });
		expect(flags.powerOn).toBe(false);
	});
});

describe('dataToEvent', () => {
	it('parses ds.system.state into event.system.state payload', () => {
		const buf = new Uint8Array(16);
		const dv = new DataView(buf.buffer);
		dv.setInt16(0, -300, true); // mainCurrent_mA
		dv.setInt16(2, 150, true); // progCurrent_mA
		dv.setInt16(4, -100, true); // filteredMainCurrent_mA
		dv.setInt16(6, 42, true); // temperature_C
		dv.setUint16(8, 1234, true); // supplyVoltage_mV
		dv.setUint16(10, 3300, true); // vccVoltage_mV
		dv.setUint8(12, 0x05); // centralState
		dv.setUint8(13, 0x06); // centralStateEx
		dv.setUint8(15, 0x07); // capabilities

		// feed into dataToEvent
		const ds = { kind: 'ds.system.state', state: buf } as const;
		const events = dataToEvent(ds as any);
		expect(events).toHaveLength(1);
		const e = events[0];
		expect(e.type).toBe('event.z21.status');
		if (e.type === 'event.z21.status') {
			expect(e.payload.mainCurrent_mA).toBe(-300);
			expect(e.payload.progCurrent_mA).toBe(150);
			expect(e.payload.filteredMainCurrent_mA).toBe(-100);
			expect(e.payload.temperature_C).toBe(42);
			expect(e.payload.supplyVoltage_mV).toBe(1234);
			expect(e.payload.vccVoltage_mV).toBe(3300);
			expect(e.payload.centralState).toBe(0x05);
			expect(e.payload.centralStateEx).toBe(0x06);
			expect(e.payload.capabilities).toBe(0x07);
		}
	});

	it("parses ds.x.bus 'event.loco.info frames", () => {
		const addr = 0x0123;
		const adrMsb = (addr >> 8) & 0x3f;
		const adrLsb = addr & 0xff;
		// [xHeader, adrMsb, adrLsb, db2 (speed step code), db3 (forward bit + speedRaw)]
		const payload = new Uint8Array([0xef, adrMsb, adrLsb, 0x02, 0x80 | 0x40]); // speedStepCode=2 -> 28, forward=true, speedRaw=64
		const ds = { kind: 'ds.x.bus', xHeader: 0xef, data: payload } as const;
		const events = dataToEvent(ds as any);
		expect(events).toHaveLength(1);
		const e = events[0];
		expect(e.type).toBe('event.loco.info');
		if (e.type === 'event.loco.info') {
			expect(e.addr).toBe(addr);
			expect(e.speedSteps).toBe(28);
			expect(e.forward).toBe(true);
			expect(e.speedRaw).toBe(64);
		}
	});
});
