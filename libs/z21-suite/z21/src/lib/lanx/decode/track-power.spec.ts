/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../event/event-types';

import { decodeLanXTrackPowerPayload } from './track-power';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;

describe('decodeLanXTrackPower', () => {
	it('returns track.power off when command is LAN_X_BC_TRACK_POWER_OFF', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF') as TrackPowerEvent[];

		expect(events).toEqual([{ type: 'event.track.power', on: false }]);
	});

	it('returns track.power on when command is LAN_X_BC_TRACK_POWER_ON', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON') as TrackPowerEvent[];

		expect(events).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('returns track.power on with programmingMode flag when command is LAN_X_BC_PROGRAMMING_MODE', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_PROGRAMMING_MODE') as TrackPowerEvent[];

		expect(events).toEqual([{ type: 'event.track.power', on: true, programmingMode: true }]);
	});

	it('returns track.power off with shortCircuit flag when command is LAN_X_BC_TRACK_SHORT_CIRCUIT', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_SHORT_CIRCUIT') as TrackPowerEvent[];

		expect(events).toEqual([{ type: 'event.track.power', on: false, shortCircuit: true }]);
	});

	it('returns empty array for other commands', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_UNKNOWN_COMMAND') as TrackPowerEvent[];

		expect(events).toEqual([]);
	});

	it('returns single event in array for track power on', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON');

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

	it('returns single event in array for track power off', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF');

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

	it('returns single event in array for programming mode', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_PROGRAMMING_MODE');

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

	it('returns single event in array for short circuit', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_SHORT_CIRCUIT');

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

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

	it('does not include programmingMode flag for regular track power on', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_ON') as TrackPowerEvent[];

		expect(events[0].programmingMode).toBeUndefined();
	});

	it('does not include shortCircuit flag for regular track power off', () => {
		const events = decodeLanXTrackPowerPayload('LAN_X_BC_TRACK_POWER_OFF') as TrackPowerEvent[];

		expect(events[0].shortCircuit).toBeUndefined();
	});
});
