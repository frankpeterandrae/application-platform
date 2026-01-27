/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '@application-platform/z21-shared';
import { LanXCommandKey, PowerPayload } from '@application-platform/z21-shared';

import { decodeLanXTrackPowerPayload } from './track-power';

type TrackPowerEvent = Extract<Z21Event, { event: 'system.event.track.power' }>;

describe('decodeLanXTrackPowerPayload', () => {
	// Helper function to extract first track power event from result (similar to helper functions in bootstrap.spec.ts)
	function extractTrackPowerEvent(command: LanXCommandKey): TrackPowerEvent {
		const events = decodeLanXTrackPowerPayload(command) as TrackPowerEvent[];
		return events[0];
	}

	// Helper function to verify track power state
	function expectTrackPowerState(event: TrackPowerEvent, expectedValues: PowerPayload): void {
		expect(event.event).toBe('system.event.track.power');
		expect(event.payload.powerOn).toBe(expectedValues.powerOn);
		expect(event.payload.programmingMode).toBe(expectedValues.programmingMode);
		expect(event.payload.shortCircuit).toBe(expectedValues.shortCircuit);
		expect(event.payload.emergencyStop).toBe(expectedValues.emergencyStop);
	}

	// Helper function to verify event array structure
	function expectEventArray(events: Z21Event[], expectedLength: number): void {
		expect(Array.isArray(events)).toBe(true);
		expect(events).toHaveLength(expectedLength);
	}

	// Helper function to verify empty result
	function expectEmptyResult(events: Z21Event[]): void {
		expect(events).toEqual([]);
		expectEventArray(events, 0);
	}

	describe('power off commands', () => {
		it('decodes power off state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_POWER_OFF');

			expectTrackPowerState(event, { powerOn: false, emergencyStop: false, programmingMode: false, shortCircuit: false });
		});

		it('returns single event in array for track power off', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF');

			expectEventArray(events, 1);
		});
	});

	describe('power on commands', () => {
		it('decodes power on state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_POWER_ON');

			expectTrackPowerState(event, { powerOn: true, emergencyStop: false, programmingMode: false, shortCircuit: false });
		});

		it('returns single event in array for track power on', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON');

			expectEventArray(events, 1);
		});
	});

	describe('programming mode', () => {
		it('decodes programming mode state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_PROGRAMMING_MODE');

			expectTrackPowerState(event, { powerOn: true, programmingMode: true, emergencyStop: false, shortCircuit: false });
		});

		it('returns single event in array for programming mode', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_PROGRAMMING_MODE');

			expectEventArray(events, 1);
		});
	});

	describe('shortCircuit circuit', () => {
		it('decodes shortCircuit circuit state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_SHORT_CIRCUIT');

			expectTrackPowerState(event, { powerOn: false, shortCircuit: true, programmingMode: false, emergencyStop: false });
		});

		it('returns single event in array for shortCircuit circuit', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_SHORT_CIRCUIT');

			expectEventArray(events, 1);
		});
	});

	describe('event type validation', () => {
		it('event has type track.power for all valid commands', () => {
			const onEvent = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON')[0];
			const offEvent = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF')[0];
			const progEvent = decodeLanXTrackPowerPayload('LAN_X_BC_PROGRAMMING_MODE')[0];
			const shortEvent = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_SHORT_CIRCUIT')[0];

			expect(onEvent.event).toBe('system.event.track.power');
			expect(offEvent.event).toBe('system.event.track.power');
			expect(progEvent.event).toBe('system.event.track.power');
			expect(shortEvent.event).toBe('system.event.track.power');
		});
	});

	describe('unknown commands', () => {
		it('returns empty array for unhandled command', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_GET_VERSION' as LanXCommandKey) as TrackPowerEvent[];

			expectEmptyResult(events);
		});
	});
});
