/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LAN_X_COMMANDS } from '@application-platform/z21-shared';

import { Z21Dataset } from '../codec/codec-types';

import { datasetsToEvents } from './datasets-to-events';
describe('datasetsToEvents', () => {
	// Helper function to create system.state dataset (similar to helper functions in bootstrap.spec.ts)
	function makeSystemStateDataset(values: {
		mainCurrent?: number;
		progCurrent?: number;
		filteredMainCurrent?: number;
		temperature?: number;
		supplyVoltage?: number;
		vccVoltage?: number;
		centralState?: number;
		centralStateEx?: number;
		capabilities?: number;
	}): Z21Dataset {
		const state = new Uint8Array(16);
		const view = new DataView(state.buffer);
		view.setUint16(0, values.mainCurrent ?? 0, true);
		view.setUint16(2, values.progCurrent ?? 0, true);
		view.setUint16(4, values.filteredMainCurrent ?? 0, true);
		view.setUint16(6, values.temperature ?? 0, true);
		view.setUint16(8, values.supplyVoltage ?? 0, true);
		view.setUint16(10, values.vccVoltage ?? 0, true);
		state[12] = values.centralState ?? 0;
		state[13] = values.centralStateEx ?? 0;
		state[15] = values.capabilities ?? 0; // UInt8 at position 15, not UInt16LE at 14
		return { kind: 'ds.system.state', state };
	}

	// Helper function to create x.bus dataset
	function makeXBusDataset(xHeader: number, data: number[]): Z21Dataset {
		return { kind: 'ds.x.bus', xHeader, data: Uint8Array.from(data) };
	}

	// Helper function to create hwinfo dataset
	function makeHwInfoDataset(hwtype: number, fwVersionBcd: number): Z21Dataset {
		return { kind: 'ds.hwinfo', hwtype, fwVersionBcd };
	}

	// Helper function to create code dataset
	function makeCodeDataset(code: number): Z21Dataset {
		return { kind: 'ds.code', code };
	}

	// Helper function to verify event array has specific length
	function expectEventCount(events: unknown[], count: number): void {
		expect(Array.isArray(events)).toBe(true);
		expect(events).toHaveLength(count);
	}

	describe('system.state datasets', () => {
		it('emits system.state with decoded payload', () => {
			const dataset = makeSystemStateDataset({
				mainCurrent: 1,
				progCurrent: 2,
				filteredMainCurrent: 3,
				temperature: 4,
				supplyVoltage: 5,
				vccVoltage: 6,
				centralState: 7,
				centralStateEx: 8,
				capabilities: 9
			});

			const events = datasetsToEvents(dataset);

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

		it('handles system.state with all zeros', () => {
			const dataset = makeSystemStateDataset({});

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
			expect(events[0].type).toBe('event.system.state');
			if (events[0].type === 'event.system.state') {
				expect(events[0].payload.mainCurrent_mA).toBe(0);
				expect(events[0].payload.progCurrent_mA).toBe(0);
			}
		});

		it('handles system.state with maximum values', () => {
			const state = Uint8Array.from(Array(16).fill(0xff));
			const dataset: Z21Dataset = { kind: 'ds.system.state', state };

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
			expect(events[0].type).toBe('event.system.state');
		});

		it('returns exactly one event for system.state datasets', () => {
			const dataset = makeSystemStateDataset({});

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
		});
	});

	describe('x.bus datasets', () => {
		it('emits z21.status for status changed dataset', () => {
			const xlan = LAN_X_COMMANDS.LAN_X_STATUS_CHANGED;
			const dataset = makeXBusDataset(xlan.xHeader, [xlan.xBusCmd!, 0xaa]);

			const events = datasetsToEvents(dataset);

			expect(events).toEqual([
				{
					type: 'event.z21.status',
					payload: { emergencyStop: false, powerOn: false, programmingMode: true, shortCircuit: false }
				}
			]);
		});

		it('delegates to decodeLanXPayload for x.bus datasets', () => {
			const xlan = LAN_X_COMMANDS.LAN_X_STATUS_CHANGED;
			const dataset = makeXBusDataset(xlan.xHeader, [xlan.xBusCmd!, 0x00]);

			const events = datasetsToEvents(dataset);

			expect(events.length).toBeGreaterThan(0);
			expect(events[0].type).toBe('event.z21.status');
		});

		it('returns decoded events from decodeLanXPayload', () => {
			const trackPowerHeader = 0x61;
			const dataset = makeXBusDataset(trackPowerHeader, [0x00]);

			const events = datasetsToEvents(dataset);

			expect(Array.isArray(events)).toBe(true);
		});

		it('handles track power off event', () => {
			const dataset = makeXBusDataset(0x61, [0x00]);

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
			expect(events[0].type).toBe('event.track.power');
		});

		it('handles track power on event', () => {
			const dataset = makeXBusDataset(0x61, [0x01]);

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
			expect(events[0].type).toBe('event.track.power');
		});
	});

	describe('hwinfo datasets', () => {
		it('emits z21.hwinfo with decoded hardware type and firmware version', () => {
			const dataset = makeHwInfoDataset(0x00000200, 0x00000120);

			const events = datasetsToEvents(dataset);

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
			const dataset = makeHwInfoDataset(0x00000201, 0x00000230);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.hardwareType).toBe('Z21_NEW');
				expect(events[0].payload.majorVersion).toBe(2);
				expect(events[0].payload.minorVersion).toBe(30);
			}
		});

		it('emits z21.hwinfo for Z21_XL hardware type', () => {
			const dataset = makeHwInfoDataset(0x00000211, 0x00000145);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.hardwareType).toBe('Z21_XL');
				expect(events[0].payload.majorVersion).toBe(1);
				expect(events[0].payload.minorVersion).toBe(45);
			}
		});

		it('emits z21.hwinfo with UNKNOWN hardware type for unrecognized type', () => {
			const dataset = makeHwInfoDataset(0x99999999, 0x00000100);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.hardwareType).toBe('UNKNOWN');
			}
		});

		it('emits z21.hwinfo with minimum firmware version', () => {
			const dataset = makeHwInfoDataset(0x00000200, 0x00000000);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.majorVersion).toBe(0);
				expect(events[0].payload.minorVersion).toBe(0);
			}
		});

		it('emits z21.hwinfo with maximum firmware version 9.99', () => {
			const dataset = makeHwInfoDataset(0x00000200, 0x00000999);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].payload.majorVersion).toBe(9);
				expect(events[0].payload.minorVersion).toBe(99);
			}
		});

		it('includes raw data in z21.hwinfo event', () => {
			const dataset = makeHwInfoDataset(0x00000201, 0x00000120);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.hwinfo');
			if (events[0].type === 'event.z21.hwinfo') {
				expect(events[0].raw).toEqual([0x00000201, 0x00000120]);
			}
		});

		it('returns exactly one event for hwinfo datasets', () => {
			const dataset = makeHwInfoDataset(0x00000200, 0x00000120);

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
		});
	});

	describe('code datasets', () => {
		it('emits z21.code with code value 0', () => {
			const dataset = makeCodeDataset(0);

			const events = datasetsToEvents(dataset);

			expect(events).toEqual([
				{
					type: 'event.z21.code',
					code: 0,
					raw: [0]
				}
			]);
		});

		it('emits z21.code with code value 255', () => {
			const dataset = makeCodeDataset(255);

			const events = datasetsToEvents(dataset);

			expect(events).toEqual([
				{
					type: 'event.z21.code',
					code: 255,
					raw: [255]
				}
			]);
		});

		it('emits z21.code with arbitrary code value', () => {
			const dataset = makeCodeDataset(42);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.code');
			if (events[0].type === 'event.z21.code') {
				expect(events[0].code).toBe(42);
				expect(events[0].raw).toEqual([42]);
			}
		});

		it('includes raw data in z21.code event', () => {
			const dataset = makeCodeDataset(123);

			const events = datasetsToEvents(dataset);

			expect(events[0].type).toBe('event.z21.code');
			if (events[0].type === 'event.z21.code') {
				expect(events[0].raw).toEqual([123]);
			}
		});

		it('returns exactly one event for code datasets', () => {
			const dataset = makeCodeDataset(42);

			const events = datasetsToEvents(dataset);

			expectEventCount(events, 1);
		});
	});
	describe('unknown and bad_xor datasets', () => {
		it('returns empty array for unknown datasets', () => {
			const payload = Buffer.from([0x01, 0x02, 0x03]);
			const dataset: Z21Dataset = { kind: 'ds.unknown', header: 0x1234, payload, reason: 'test reason' };

			const events = datasetsToEvents(dataset);

			expect(events).toEqual([]);
		});

		it('returns empty array for bad_xor datasets', () => {
			const dataset: Z21Dataset = { kind: 'ds.bad_xor', calc: '0x42', recv: '0x43' };

			const events = datasetsToEvents(dataset);

			expect(events).toEqual([]);
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
