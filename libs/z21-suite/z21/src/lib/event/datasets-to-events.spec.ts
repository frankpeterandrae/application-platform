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

	it('emits z21.status for status changed dataset', () => {
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

	it('returns empty array for bad_xor datasets', () => {
		expect(datasetsToEvents({ kind: 'ds.bad_xor', calc: '0x42', recv: '0x43' })).toEqual([]);
	});

	describe('hwinfo datasets', () => {
		it('emits z21.hwinfo with decoded hardware type and firmware version', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000120 });

			expect(events).toEqual([
				{
					type: 'event.z21.hwinfo',
					payload: {
						hardwareType: 'Z21_OLD',
						majorVersion: 1,
						minorVersion: 20
					},
					raw: [0x00000200, 0x00000120]
				}
			]);
		});

		it('emits z21.hwinfo for Z21_NEW hardware type', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000201, fwVersionBcd: 0x00000230 });

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.hardwareType).toBe('Z21_NEW');
				expect(events[0].payload.majorVersion).toBe(2);
				expect(events[0].payload.minorVersion).toBe(30);
			}
		});

		it('emits z21.hwinfo for Z21_XL hardware type', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000211, fwVersionBcd: 0x00000145 });

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.hardwareType).toBe('Z21_XL');
				expect(events[0].payload.majorVersion).toBe(1);
				expect(events[0].payload.minorVersion).toBe(45);
			}
		});

		it('emits z21.hwinfo with UNKNOWN hardware type for unrecognized type', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x99999999, fwVersionBcd: 0x00000100 });

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.hardwareType).toBe('UNKNOWN');
			}
		});

		it('emits z21.hwinfo with minimum firmware version', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000000 });

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.majorVersion).toBe(0);
				expect(events[0].payload.minorVersion).toBe(0);
			}
		});

		it('emits z21.hwinfo with maximum firmware version 9.99', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000999 });

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.majorVersion).toBe(9);
				expect(events[0].payload.minorVersion).toBe(99);
			}
		});

		it('includes raw data in z21.hwinfo event', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000201, fwVersionBcd: 0x00000120 });

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].raw).toEqual([0x00000201, 0x00000120]);
			}
		});
	});

	describe('code datasets', () => {
		it('emits z21.code with code value 0', () => {
			const events = datasetsToEvents({ kind: 'ds.code', code: 0 });

			expect(events).toEqual([
				{
					type: 'event.z21.code',
					code: 0,
					raw: [0]
				}
			]);
		});

		it('emits z21.code with code value 255', () => {
			const events = datasetsToEvents({ kind: 'ds.code', code: 255 });

			expect(events).toEqual([
				{
					type: 'event.z21.code',
					code: 255,
					raw: [255]
				}
			]);
		});

		it('emits z21.code with arbitrary code value', () => {
			const events = datasetsToEvents({ kind: 'ds.code', code: 42 });

			expect(events[0].type).toBe('event.z21.code');
			if (events[0].type === 'event.z21.code') {
				expect(events[0].code).toBe(42);
				expect(events[0].raw).toEqual([42]);
			}
		});

		it('includes raw data in z21.code event', () => {
			const events = datasetsToEvents({ kind: 'ds.code', code: 123 });

			expect(events[0].type).toBe('event.z21.code');
			if (events[0].type === 'event.z21.code') {
				expect(events[0].raw).toEqual([123]);
			}
		});
	});

	describe('x.bus datasets', () => {
		it('delegates to decodeLanXPayload for x.bus datasets', () => {
			const xlan = LAN_X_COMMANDS.LAN_X_STATUS_CHANGED;
			const data = Uint8Array.from([xlan.xBusCmd, 0x00]);
			const events = datasetsToEvents({ kind: 'ds.x.bus', xHeader: xlan.xHeader, data: data });

			expect(events.length).toBeGreaterThan(0);
			expect(events[0].type).toBe('event.z21.status');
		});

		it('returns decoded events from decodeLanXPayload', () => {
			const trackPowerHeader = 0x61;
			const data = Uint8Array.from([0x00]);
			const events = datasetsToEvents({ kind: 'ds.x.bus', xHeader: trackPowerHeader, data: data });

			expect(Array.isArray(events)).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('handles system.state with all zeros', () => {
			const state = Uint8Array.from(Array(16).fill(0));
			const events = datasetsToEvents({ kind: 'ds.system.state', state });

			expect(events.length).toBe(1);
			expect(events[0].type).toBe('event.system.state');
			if (events[0].type === 'event.system.state') {
				expect(events[0].payload.mainCurrent_mA).toBe(0);
			}
		});

		it('handles system.state with maximum values', () => {
			const state = Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
			const events = datasetsToEvents({ kind: 'ds.system.state', state });

			expect(events.length).toBe(1);
			expect(events[0].type).toBe('event.system.state');
		});

		it('returns exactly one event for system.state datasets', () => {
			const state = Uint8Array.from(Array(16).fill(0));
			const events = datasetsToEvents({ kind: 'ds.system.state', state });

			expect(events.length).toBe(1);
		});

		it('returns exactly one event for hwinfo datasets', () => {
			const events = datasetsToEvents({ kind: 'ds.hwinfo', hwtype: 0x00000200, fwVersionBcd: 0x00000120 });

			expect(events.length).toBe(1);
		});

		it('returns exactly one event for code datasets', () => {
			const events = datasetsToEvents({ kind: 'ds.code', code: 42 });

			expect(events.length).toBe(1);
		});

		it('handles multiple unknown dataset types consistently', () => {
			const payload = Buffer.from([0x01, 0x02, 0x03]);
			const events1 = datasetsToEvents({ kind: 'ds.unknown', header: 0x1234, payload, reason: 'test1' });
			const events2 = datasetsToEvents({ kind: 'ds.unknown', header: 0x5678, payload, reason: 'test2' });

			expect(events1).toEqual([]);
			expect(events2).toEqual([]);
		});

		it('handles bad_xor with different values consistently', () => {
			const events1 = datasetsToEvents({ kind: 'ds.bad_xor', calc: '0x42', recv: '0x43' });
			const events2 = datasetsToEvents({ kind: 'ds.bad_xor', calc: '0xff', recv: '0x00' });

			expect(events1).toEqual([]);
			expect(events2).toEqual([]);
		});
	});
});
