/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../z21/event-types';

import { decodeLanXTrackPower } from './track-power';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;

describe('decodeLanXTrackPower', () => {
	it('returns track.power off when command is LAN_X_BC_TRACK_POWER_OFF', () => {
		const events = decodeLanXTrackPower('LAN_X_BC_TRACK_POWER_OFF', new Uint8Array()) as TrackPowerEvent[];

		expect(events).toEqual([{ type: 'event.track.power', on: false }]);
	});

	it('returns track.power on when command is LAN_X_BC_TRACK_POWER_ON', () => {
		const events = decodeLanXTrackPower('LAN_X_BC_TRACK_POWER_ON', new Uint8Array()) as TrackPowerEvent[];

		expect(events).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('returns empty array for other commands', () => {
		const events = decodeLanXTrackPower('LAN_X_UNKNOWN_COMMAND', new Uint8Array()) as TrackPowerEvent[];

		expect(events).toEqual([]);
	});
});
