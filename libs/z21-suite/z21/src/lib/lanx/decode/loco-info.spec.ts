/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Direction } from '@application-platform/z21-shared';

import {
	AddessByteMask,
	F13ToF20FunctionsByteMask,
	F21ToF28FunctionsByteMask,
	F29ToF31FunctionsByteMask,
	F5ToF12FunctionsByteMask,
	InfoByteMask,
	LowFunctionsByteMask,
	SpeedByteMask
} from '../../constants';
import { type Z21Event } from '../../event/event-types';

import { decodeLanXLocoInfoPayload } from './loco-info';

type LocoInfoEvent = Extract<Z21Event, { type: 'event.loco.info' }>;

describe('decodeLanXLocoInfoPayload', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to extract first loco info event from result
	function extractLocoInfo(payload: Uint8Array): LocoInfoEvent {
		const events = decodeLanXLocoInfoPayload(payload) as LocoInfoEvent[];
		return events[0];
	}

	// Helper function to verify address decoding
	function expectAddress(event: LocoInfoEvent, adrMsb: number, adrLsb: number): void {
		expect(event.addr).toBe(((adrMsb & AddessByteMask.MSB) << 8) + adrLsb);
		expect(event.type).toBe('event.loco.info');
	}

	// Helper function to verify speed and direction
	function expectSpeedAndDirection(
		event: LocoInfoEvent,
		expectedValues: {
			speedSteps: number;
			speed: number;
			direction: Direction;
			emergencyStop: boolean;
		}
	): void {
		expect(event.speedSteps).toBe(expectedValues.speedSteps);
		expect(event.speed).toBe(expectedValues.speed);
		expect(event.direction).toBe(expectedValues.direction);
		expect(event.emergencyStop).toBe(expectedValues.emergencyStop);
	}

	// Helper function to verify loco type flags
	function expectLocoFlags(
		event: LocoInfoEvent,
		expectedValues: {
			isMmLoco?: boolean;
			isOccupied?: boolean;
			isDoubleTraction?: boolean;
			isSmartsearch?: boolean;
		}
	): void {
		if (expectedValues.isMmLoco !== undefined) expect(event.isMmLoco).toBe(expectedValues.isMmLoco);
		if (expectedValues.isOccupied !== undefined) expect(event.isOccupied).toBe(expectedValues.isOccupied);
		if (expectedValues.isDoubleTraction !== undefined) expect(event.isDoubleTraction).toBe(expectedValues.isDoubleTraction);
		if (expectedValues.isSmartsearch !== undefined) expect(event.isSmartsearch).toBe(expectedValues.isSmartsearch);
	}

	// Helper function to verify function states
	function expectFunctionStates(event: LocoInfoEvent, states: Array<{ fn: number; state: boolean | undefined }>): void {
		for (const { fn, state } of states) {
			expect(event.functionMap[fn]).toBe(state);
		}
	}

	// Helper function to create all function bytes with all bits set
	function makeAllFunctionsSet(): { db4: number; db5: number; db6: number; db7: number; db8: number } {
		return {
			db4:
				LowFunctionsByteMask.L |
				LowFunctionsByteMask.F1 |
				LowFunctionsByteMask.F2 |
				LowFunctionsByteMask.F3 |
				LowFunctionsByteMask.F4 |
				LowFunctionsByteMask.D |
				LowFunctionsByteMask.S,
			db5:
				F5ToF12FunctionsByteMask.F5 |
				F5ToF12FunctionsByteMask.F6 |
				F5ToF12FunctionsByteMask.F7 |
				F5ToF12FunctionsByteMask.F8 |
				F5ToF12FunctionsByteMask.F9 |
				F5ToF12FunctionsByteMask.F10 |
				F5ToF12FunctionsByteMask.F11 |
				F5ToF12FunctionsByteMask.F12,
			db6:
				F13ToF20FunctionsByteMask.F13 |
				F13ToF20FunctionsByteMask.F14 |
				F13ToF20FunctionsByteMask.F15 |
				F13ToF20FunctionsByteMask.F16 |
				F13ToF20FunctionsByteMask.F17 |
				F13ToF20FunctionsByteMask.F18 |
				F13ToF20FunctionsByteMask.F19 |
				F13ToF20FunctionsByteMask.F20,
			db7:
				F21ToF28FunctionsByteMask.F21 |
				F21ToF28FunctionsByteMask.F22 |
				F21ToF28FunctionsByteMask.F23 |
				F21ToF28FunctionsByteMask.F24 |
				F21ToF28FunctionsByteMask.F25 |
				F21ToF28FunctionsByteMask.F26 |
				F21ToF28FunctionsByteMask.F27 |
				F21ToF28FunctionsByteMask.F28,
			db8: F29ToF31FunctionsByteMask.F29 | F29ToF31FunctionsByteMask.F30 | F29ToF31FunctionsByteMask.F31
		};
	}

	describe('complete payload decoding', () => {
		it('decodes full payload with all flags and functions', () => {
			const adrMsb = 0x12;
			const adrLsb = 0x34;
			const db2 = InfoByteMask.MM_LOCO | InfoByteMask.OCCUPIED | 0b10; // speedStepCode=2 => 28 steps
			const db3 = SpeedByteMask.DIRECTION_FORWARD | 0b00101; // raw=5 => speed=4
			const { db4, db5, db6, db7, db8 } = makeAllFunctionsSet();

			const event = extractLocoInfo(makePayload(adrMsb, adrLsb, db2, db3, db4, db5, db6, db7, db8));

			expectAddress(event, adrMsb, adrLsb);
			expectLocoFlags(event, {
				isMmLoco: true,
				isOccupied: true,
				isDoubleTraction: true,
				isSmartsearch: true
			});
			expectSpeedAndDirection(event, {
				speedSteps: 28,
				speed: 4,
				direction: Direction.FWD,
				emergencyStop: false
			});
			expectFunctionStates(event, [
				{ fn: 0, state: true },
				{ fn: 4, state: true },
				{ fn: 5, state: true },
				{ fn: 12, state: true },
				{ fn: 13, state: true },
				{ fn: 20, state: true },
				{ fn: 21, state: true },
				{ fn: 28, state: true },
				{ fn: 29, state: true },
				{ fn: 31, state: true }
			]);
		});
	});

	describe('speed and emergency stop decoding', () => {
		it('maps speed steps and emergency stop when raw speed is 1', () => {
			const event = extractLocoInfo(makePayload(0, 1, 0b10, 0b00000001, 0, 0));

			expectSpeedAndDirection(event, {
				speedSteps: 28,
				emergencyStop: true,
				speed: 0,
				direction: Direction.REV
			});
		});

		it('maps speed steps to 14 when step code is 0 and speed raw is 0', () => {
			const event = extractLocoInfo(makePayload(0, 1, 0b00, 0b00000000, 0));

			expectSpeedAndDirection(event, {
				speedSteps: 14,
				speed: 0,
				emergencyStop: false,
				direction: Direction.REV
			});
		});

		it('maps speed steps to 128 when step code is not 0 or 2', () => {
			const event = extractLocoInfo(makePayload(0, 1, 0b01, 0b00000110, 0));

			expectSpeedAndDirection(event, {
				speedSteps: 128,
				speed: 5,
				direction: Direction.REV,
				emergencyStop: false
			});
		});

		it('decodes speed correctly for 28 speed steps', () => {
			const event = extractLocoInfo(makePayload(0, 1, 0b10, SpeedByteMask.DIRECTION_FORWARD | 0b00101, 0));

			expectSpeedAndDirection(event, {
				speedSteps: 28,
				speed: 4,
				direction: Direction.FWD,
				emergencyStop: false
			});
		});

		it('decodes maximum speed value', () => {
			const event = extractLocoInfo(makePayload(0, 1, 0b10, SpeedByteMask.DIRECTION_FORWARD | 0b01111111, 0));

			expectSpeedAndDirection(event, {
				speedSteps: 28,
				speed: 126,
				direction: Direction.FWD,
				emergencyStop: false
			});
		});
	});

	describe('function decoding', () => {
		it('handles minimal payload setting only F0-F4 functions', () => {
			const db4 = LowFunctionsByteMask.L | LowFunctionsByteMask.F1;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, db4));

			expectFunctionStates(event, [
				{ fn: 0, state: true },
				{ fn: 1, state: true },
				{ fn: 2, state: false },
				{ fn: 5, state: undefined },
				{ fn: 13, state: undefined },
				{ fn: 21, state: undefined },
				{ fn: 29, state: undefined }
			]);
		});

		it('decodes F5-F12 functions when present', () => {
			const db5 = F5ToF12FunctionsByteMask.F5 | F5ToF12FunctionsByteMask.F12;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, 0, db5));

			expectFunctionStates(event, [
				{ fn: 5, state: true },
				{ fn: 6, state: false },
				{ fn: 12, state: true }
			]);
		});

		it('decodes F13-F20 functions when present', () => {
			const db6 = F13ToF20FunctionsByteMask.F13 | F13ToF20FunctionsByteMask.F20;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, 0, 0, db6));

			expectFunctionStates(event, [
				{ fn: 13, state: true },
				{ fn: 14, state: false },
				{ fn: 20, state: true }
			]);
		});

		it('decodes F21-F28 functions when present', () => {
			const db7 = F21ToF28FunctionsByteMask.F21 | F21ToF28FunctionsByteMask.F28;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, 0, 0, 0, db7));

			expectFunctionStates(event, [
				{ fn: 21, state: true },
				{ fn: 22, state: false },
				{ fn: 28, state: true }
			]);
		});

		it('decodes F29-F31 functions when present', () => {
			const db8 = F29ToF31FunctionsByteMask.F29 | F29ToF31FunctionsByteMask.F31;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, 0, 0, 0, 0, db8));

			expectFunctionStates(event, [
				{ fn: 29, state: true },
				{ fn: 30, state: false },
				{ fn: 31, state: true }
			]);
		});
	});

	describe('loco type flags', () => {
		it('decodes MM loco flag', () => {
			const db2 = InfoByteMask.MM_LOCO;
			const event = extractLocoInfo(makePayload(0, 1, db2, 0, 0));

			expectLocoFlags(event, { isMmLoco: true });
		});

		it('decodes occupied flag', () => {
			const db2 = InfoByteMask.OCCUPIED;
			const event = extractLocoInfo(makePayload(0, 1, db2, 0, 0));

			expectLocoFlags(event, { isOccupied: true });
		});

		it('decodes double traction flag', () => {
			const db4 = LowFunctionsByteMask.D;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, db4));

			expectLocoFlags(event, { isDoubleTraction: true });
		});

		it('decodes smartsearch flag', () => {
			const db4 = LowFunctionsByteMask.S;
			const event = extractLocoInfo(makePayload(0, 1, 0, 0, db4));

			expectLocoFlags(event, { isSmartsearch: true });
		});
	});

	describe('address decoding', () => {
		it('decodes short address', () => {
			const event = extractLocoInfo(makePayload(0x00, 0x03, 0, 0, 0));

			expect(event.addr).toBe(3);
		});

		it('decodes long address', () => {
			const event = extractLocoInfo(makePayload(0xc5, 0x39, 0, 0, 0));

			expect(event.addr).toBe(1337);
		});

		it('masks MSB to 6 bits', () => {
			const event = extractLocoInfo(makePayload(0xff, 0x42, 0, 0, 0));

			expect(event.addr).toBe(0x3f42);
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same payload', () => {
			const payload = makePayload(0x12, 0x34, 0b10, 0b00101, 0);

			const events1 = decodeLanXLocoInfoPayload(payload);
			const events2 = decodeLanXLocoInfoPayload(payload);

			expect(events1[0]).toEqual(events2[0]);
		});

		it('returns single event in array', () => {
			const events = decodeLanXLocoInfoPayload(makePayload(0, 1, 0, 0, 0)) as LocoInfoEvent[];

			expect(events).toHaveLength(1);
		});
	});
});
