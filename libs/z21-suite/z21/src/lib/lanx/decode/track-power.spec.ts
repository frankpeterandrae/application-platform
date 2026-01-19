/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { LanXCommandKey } from '@application-platform/z21-shared';

import type { Z21Event } from '../../event/event-types';

import { decodeLanXTrackPowerPayload } from './track-power';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;

describe('decodeLanXTrackPowerPayload', () => {
	// Helper function to extract first track power event from result (similar to helper functions in bootstrap.spec.ts)
	function extractTrackPowerEvent(command: LanXCommandKey): TrackPowerEvent {
		const events = decodeLanXTrackPowerPayload(command) as TrackPowerEvent[];
		return events[0];
	}

	// Helper function to verify track power state
	function expectTrackPowerState(
		event: TrackPowerEvent,
		expectedValues: {
			on: boolean;
			programmingMode?: boolean;
			shortCircuit?: boolean;
		}
	): void {
		expect(event.type).toBe('event.track.power');
		expect(event.on).toBe(expectedValues.on);
		if (expectedValues.programmingMode !== undefined) {
			expect(event.programmingMode).toBe(expectedValues.programmingMode);
		}
		if (expectedValues.shortCircuit !== undefined) {
			expect(event.shortCircuit).toBe(expectedValues.shortCircuit);
		}
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
		it('returns track.power off when command is LAN_X_BC_TRACK_POWER_OFF', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF') as TrackPowerEvent[];

			expect(events).toEqual([{ type: 'event.track.power', on: false }]);
		});

		it('decodes power off state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_POWER_OFF');

			expectTrackPowerState(event, { on: false });
		});

		it('does not include shortCircuit flag for regular track power off', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_POWER_OFF');

			expect(event.shortCircuit).toBeUndefined();
		});

		it('returns single event in array for track power off', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF');

			expectEventArray(events, 1);
		});
	});

	describe('power on commands', () => {
		it('returns track.power on when command is LAN_X_BC_TRACK_POWER_ON', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON') as TrackPowerEvent[];

			expect(events).toEqual([{ type: 'event.track.power', on: true }]);
		});

		it('decodes power on state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_POWER_ON');

			expectTrackPowerState(event, { on: true });
		});

		it('does not include programmingMode flag for regular track power on', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_POWER_ON');

			expect(event.programmingMode).toBeUndefined();
		});

		it('returns single event in array for track power on', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON');

			expectEventArray(events, 1);
		});
	});

	describe('programming mode', () => {
		it('returns track.power on with programmingMode flag when command is LAN_X_BC_PROGRAMMING_MODE', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_PROGRAMMING_MODE') as TrackPowerEvent[];

			expect(events).toEqual([{ type: 'event.track.power', on: true, programmingMode: true }]);
		});

		it('decodes programming mode state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_PROGRAMMING_MODE');

			expectTrackPowerState(event, { on: true, programmingMode: true });
		});

		it('returns single event in array for programming mode', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_PROGRAMMING_MODE');

			expectEventArray(events, 1);
		});
	});

	describe('short circuit', () => {
		it('returns track.power off with shortCircuit flag when command is LAN_X_BC_TRACK_SHORT_CIRCUIT', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_SHORT_CIRCUIT') as TrackPowerEvent[];

			expect(events).toEqual([{ type: 'event.track.power', on: false, shortCircuit: true }]);
		});

		it('decodes short circuit state correctly', () => {
			const event = extractTrackPowerEvent('LAN_X_BC_TRACK_SHORT_CIRCUIT');

			expectTrackPowerState(event, { on: false, shortCircuit: true });
		});

		it('returns single event in array for short circuit', () => {
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

			expect(onEvent.type).toBe('event.track.power');
			expect(offEvent.type).toBe('event.track.power');
			expect(progEvent.type).toBe('event.track.power');
			expect(shortEvent.type).toBe('event.track.power');
		});
	});

	describe('unknown commands', () => {
		it('returns empty array for unhandled command', () => {
			const events = decodeLanXTrackPowerPayload('LAN_X_GET_VERSION' as LanXCommandKey) as TrackPowerEvent[];

			expectEmptyResult(events);
		});
	});
});
