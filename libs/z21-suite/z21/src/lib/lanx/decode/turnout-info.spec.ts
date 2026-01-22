/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TurnoutState } from '@application-platform/z21-shared';

import { AddessByteMask } from '../../constants';
import { type Z21Event } from '../../event/event-types';

import { decodeLanXTurnoutInfoPayload } from './turnout-info';

type TurnoutInfoEvent = Extract<Z21Event, { event: 'switching.event.turnout.info' }>;

describe('decodeLanXTurnoutInfoPayload', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to extract first turnout info event from result
	function extractTurnoutInfo(payload: Uint8Array): TurnoutInfoEvent {
		const events = decodeLanXTurnoutInfoPayload(payload) as TurnoutInfoEvent[];
		return events[0];
	}

	// Helper function to calculate expected address from MSB and LSB
	function calculateAddress(msb: number, lsb: number): number {
		return ((msb & AddessByteMask.MSB) << 8) + lsb;
	}

	// Helper function to verify turnout state
	function expectTurnoutState(
		event: TurnoutInfoEvent,
		expectedValues: {
			state: TurnoutState;
			addr: number;
		}
	): void {
		expect(event.event).toBe('switching.event.turnout.info');
		expect(event.payload.state).toBe(expectedValues.state);
		expect(event.payload.addr).toBe(expectedValues.addr);
	}

	// Helper function to verify event array structure
	function expectEventArray(events: Z21Event[]): void {
		expect(Array.isArray(events)).toBe(true);
		expect(events).toHaveLength(1);
	}

	describe('state decoding', () => {
		it('returns STRAIGHT when zz is 1', () => {
			const payload = makePayload(0x12, 0x34, 0x01);
			const event = extractTurnoutInfo(payload);

			expectTurnoutState(event, {
				state: TurnoutState.STRAIGHT,
				addr: calculateAddress(0x12, 0x34)
			});
		});

		it('returns DIVERGING when zz is 2', () => {
			const payload = makePayload(0xab, 0xcd, 0x02);
			const event = extractTurnoutInfo(payload);

			expectTurnoutState(event, {
				state: TurnoutState.DIVERGING,
				addr: calculateAddress(0xab, 0xcd)
			});
		});

		it('returns UNKNOWN when zz is neither 1 nor 2', () => {
			const payload = makePayload(0xff, 0xee, 0x03);
			const event = extractTurnoutInfo(payload);

			expectTurnoutState(event, {
				state: TurnoutState.UNKNOWN,
				addr: calculateAddress(0xff, 0xee)
			});
		});

		it('returns UNKNOWN when zz is 0', () => {
			const payload = makePayload(0x00, 0x00, 0x00);
			const event = extractTurnoutInfo(payload);

			expect(event.payload.state).toBe(TurnoutState.UNKNOWN);
		});
	});

	describe('address decoding', () => {
		it('decodes shortCircuit address correctly', () => {
			const payload = makePayload(0x00, 0x03, 0x01);
			const event = extractTurnoutInfo(payload);

			expect(event.payload.addr).toBe(3);
		});

		it('decodes long address correctly', () => {
			const payload = makePayload(0x12, 0x34, 0x01);
			const event = extractTurnoutInfo(payload);

			expect(event.payload.addr).toBe(calculateAddress(0x12, 0x34));
		});

		it('masks MSB to 6 bits', () => {
			const payload = makePayload(0xff, 0x42, 0x01);
			const event = extractTurnoutInfo(payload);

			expect(event.payload.addr).toBe(0x3f42);
		});

		it('handles minimum address', () => {
			const payload = makePayload(0x00, 0x00, 0x01);
			const event = extractTurnoutInfo(payload);

			expect(event.payload.addr).toBe(0);
		});

		it('handles maximum address', () => {
			const payload = makePayload(0xff, 0xff, 0x01);
			const event = extractTurnoutInfo(payload);

			expect(event.payload.addr).toBe(calculateAddress(0xff, 0xff));
		});
	});

	describe('combined state and address', () => {
		it('decodes STRAIGHT with various addresses', () => {
			const addresses = [
				{ msb: 0x00, lsb: 0x01 },
				{ msb: 0x10, lsb: 0x20 },
				{ msb: 0x3f, lsb: 0xff }
			];

			for (const { msb, lsb } of addresses) {
				const event = extractTurnoutInfo(makePayload(msb, lsb, 0x01));
				expectTurnoutState(event, {
					state: TurnoutState.STRAIGHT,
					addr: calculateAddress(msb, lsb)
				});
			}
		});

		it('decodes DIVERGING with various addresses', () => {
			const addresses = [
				{ msb: 0x00, lsb: 0x01 },
				{ msb: 0x20, lsb: 0x30 },
				{ msb: 0x3f, lsb: 0xee }
			];

			for (const { msb, lsb } of addresses) {
				const event = extractTurnoutInfo(makePayload(msb, lsb, 0x02));
				expectTurnoutState(event, {
					state: TurnoutState.DIVERGING,
					addr: calculateAddress(msb, lsb)
				});
			}
		});
	});

	describe('event structure', () => {
		it('returns event with correct type property', () => {
			const event = extractTurnoutInfo(makePayload(0x12, 0x34, 0x01));

			expect(event.event).toBe('switching.event.turnout.info');
		});

		it('returns single event in array', () => {
			const events = decodeLanXTurnoutInfoPayload(makePayload(0x12, 0x34, 0x01));

			expectEventArray(events);
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same payload', () => {
			const payload = makePayload(0x12, 0x34, 0x01);

			const events1 = decodeLanXTurnoutInfoPayload(payload);
			const events2 = decodeLanXTurnoutInfoPayload(payload);

			expect(events1[0]).toEqual(events2[0]);
		});
	});

	describe('payload preservation', () => {
		it('does not modify input payload', () => {
			const payload = makePayload(0x12, 0x34, 0x01);
			const originalBytes = [payload[0], payload[1], payload[2]];

			decodeLanXTurnoutInfoPayload(payload);

			expect(payload[0]).toBe(originalBytes[0]);
			expect(payload[1]).toBe(originalBytes[1]);
			expect(payload[2]).toBe(originalBytes[2]);
		});
	});
});
