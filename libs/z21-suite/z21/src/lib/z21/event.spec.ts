import { describe, expect, it } from 'vitest';

import { dataToEvent } from './event';

describe('dataToEvent', () => {
	it('emits track power off/on events for xHeader 0x61 with db0 0/1', () => {
		const dsOff = { kind: 'ds.x.bus' as const, xHeader: 0x61, data: Uint8Array.from([0x61, 0x00]) };
		const dsOn = { kind: 'ds.x.bus' as const, xHeader: 0x61, data: Uint8Array.from([0x61, 0x01]) };

		expect(dataToEvent(dsOff)).toEqual([{ type: 'event.track.power', on: false }]);
		expect(dataToEvent(dsOn)).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('emits status event for xHeader 0x62 when db1 === 0x22', () => {
		const ds = { kind: 'ds.x.bus' as const, xHeader: 0x62, data: Uint8Array.from([0x62, 0x22, 0x7f]) };
		const ev = dataToEvent(ds);
		expect(ev).toHaveLength(1);
		expect(ev[0]).toEqual({ type: 'event.z21.status', statusMask: 0x7f });
	});

	it('parses loco info from xHeader 0xef and maps speed steps/forward/speedRaw correctly', () => {
		const adrMsb = 0x12 & 0x3f;
		const adrLsb = 0x34;
		const addr = (adrMsb << 8) | adrLsb;
		const speedStepCode = 2;
		const db2 = speedStepCode; // lower 3 bits
		const forward = true;
		const speedRaw = 0x2a;
		const db3 = (forward ? 0x80 : 0x00) | (speedRaw & 0x7f);
		const b = Uint8Array.from([0xef, adrMsb, adrLsb, db2, db3]);
		const ds = { kind: 'ds.x.bus' as const, xHeader: 0xef, data: b };

		const ev = dataToEvent(ds);
		expect(ev).toHaveLength(1);
		expect(ev[0]).toEqual({ type: 'event.loco.info', addr, speedSteps: 28, speedRaw, forward: true });
	});

	it('returns unknown.x.bus event for unrecognized xHeader', () => {
		const ds = { kind: 'ds.x.bus' as const, xHeader: 0xaa, data: Uint8Array.from([0xaa, 1, 2, 3]) };
		const ev = dataToEvent(ds);
		expect(ev).toHaveLength(1);
		expect(ev[0].type).toBe('event.unknown.x.bus');
	});
});
