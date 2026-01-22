/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { XBusCmd } from '@application-platform/z21-shared';

import { type Z21Event } from '../../event/event-types';

import { decodeLanXStatusChangedPayload } from './status-changed';

type Z21StatusEvent = Extract<Z21Event, { event: 'system.event.status' }>;

describe('decodeLanXStatusChangedPayload', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to extract first status event from result
	function extractStatusEvent(payload: Uint8Array): Z21StatusEvent {
		const events = decodeLanXStatusChangedPayload(payload) as Z21StatusEvent[];
		return events[0];
	}

	// Helper function to verify status flags
	function expectStatusFlags(
		event: Z21StatusEvent,
		expectedFlags: {
			emergencyStop: boolean;
			powerOn: boolean;
			programmingMode: boolean;
			shortCircuit: boolean;
		}
	): void {
		expect(event.event).toBe('system.event.status');
		expect(event.payload.emergencyStop).toBe(expectedFlags.emergencyStop);
		expect(event.payload.powerOn).toBe(expectedFlags.powerOn);
		expect(event.payload.programmingMode).toBe(expectedFlags.programmingMode);
		expect(event.payload.shortCircuit).toBe(expectedFlags.shortCircuit);
	}

	// Helper function to verify empty result
	function expectEmptyResult(events: Z21Event[]): void {
		expect(events).toEqual([]);
		expect(events).toHaveLength(0);
	}

	describe('status mask decoding', () => {
		it('decodes all flags false when status byte is 0x00', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0x00));

			expectStatusFlags(event, {
				emergencyStop: false,
				powerOn: true, // trackVoltageOff is NOT set, so powerOn is true
				programmingMode: false,
				shortCircuit: false
			});
		});

		it('decodes programming mode flag when bit 5 is set', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0xaa)); // 10101010

			expectStatusFlags(event, {
				emergencyStop: false,
				powerOn: false, // trackVoltageOff (bit 1) IS set in 0xaa
				programmingMode: true, // Bit 5
				shortCircuit: false
			});
		});

		it('decodes emergency stop flag when bit 0 is set', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0x01));

			expectStatusFlags(event, {
				emergencyStop: true, // Bit 0
				powerOn: true, // trackVoltageOff (bit 1) is NOT set
				programmingMode: false,
				shortCircuit: false
			});
		});

		it('decodes track voltage off flag when bit 1 is set (powerOn becomes false)', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0x02));

			expectStatusFlags(event, {
				emergencyStop: false,
				powerOn: false, // trackVoltageOff (bit 1) IS set
				programmingMode: false,
				shortCircuit: false
			});
		});

		it('decodes shortCircuit circuit flag when bit 2 is set', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0x04));

			expectStatusFlags(event, {
				emergencyStop: false,
				powerOn: true, // trackVoltageOff (bit 1) is NOT set
				programmingMode: false,
				shortCircuit: true // Bit 2
			});
		});

		it('decodes all flags true when all bits are set', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0xff));

			expectStatusFlags(event, {
				emergencyStop: true,
				powerOn: false, // trackVoltageOff (bit 1) IS set, so powerOn is false
				programmingMode: true,
				shortCircuit: true
			});
		});

		it('decodes combination of flags correctly', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0x23)); // 00100011

			expectStatusFlags(event, {
				emergencyStop: true, // Bit 0
				powerOn: false, // trackVoltageOff (bit 1) IS set
				programmingMode: true, // Bit 5
				shortCircuit: false
			});
		});
	});

	describe('edge cases and validation', () => {
		it('returns empty array when payload is too shortCircuit', () => {
			const events = decodeLanXStatusChangedPayload(makePayload(XBusCmd.STATUS_CHANGED));

			expectEmptyResult(events);
		});

		it('returns empty array when payload is empty', () => {
			const events = decodeLanXStatusChangedPayload(makePayload());

			expectEmptyResult(events);
		});

		it('handles payload with additional bytes after status byte', () => {
			const event = extractStatusEvent(makePayload(XBusCmd.STATUS_CHANGED, 0x02, 0xff, 0xff));

			expectStatusFlags(event, {
				emergencyStop: false,
				powerOn: false, // trackVoltageOff (bit 1) IS set
				programmingMode: false,
				shortCircuit: false
			});
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same payload', () => {
			const payload = makePayload(XBusCmd.STATUS_CHANGED, 0xaa);

			const events1 = decodeLanXStatusChangedPayload(payload);
			const events2 = decodeLanXStatusChangedPayload(payload);

			expect(events1[0]).toEqual(events2[0]);
		});

		it('returns single event in array', () => {
			const events = decodeLanXStatusChangedPayload(makePayload(XBusCmd.STATUS_CHANGED, 0x00)) as Z21StatusEvent[];

			expect(events).toHaveLength(1);
			expect(events[0].event).toBe('system.event.status');
		});
	});

	describe('payload preservation', () => {
		it('does not modify input payload', () => {
			const payload = makePayload(XBusCmd.STATUS_CHANGED, 0x12);
			const originalBytes = [payload[0], payload[1]];

			decodeLanXStatusChangedPayload(payload);

			expect(payload[0]).toBe(originalBytes[0]);
			expect(payload[1]).toBe(originalBytes[1]);
		});
	});
});
