/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it, vi, type Mock } from 'vitest';

import type { Z21Event } from '../../z21/event-types';

// Mock dependencies before importing the module under test
vi.mock('./loco-info', () => ({
	decodeLanXLocoInfo: vi.fn(() => [{ type: 'event.loco.info.mock' } as LocoInfoEvent])
}));

vi.mock('./turnout-info', () => ({
	decodeLanXTurnoutInfo: vi.fn(() => [{ type: 'event.turnout.info.mock' } as TurnoutInfoEvent])
}));

vi.mock('./system', () => ({
	decodeLanXSystem: vi.fn((command: string, _data: Uint8Array) => [{ type: 'event.cs.status', statusMask: 0xaa } as CsStatusEvent])
}));

vi.mock('./track-power', () => ({
	decodeLanXTrackPower: vi.fn((command: string, _data: Uint8Array) => [
		{ type: 'event.track.power', on: command === 'LAN_X_BC_TRACK_POWER_ON' } as TrackPowerEvent
	])
}));

import { decodeLanXCommand } from './decoder';
import * as locoInfo from './loco-info';
import * as system from './system';
import * as trackPower from './track-power';
import * as turnoutInfo from './turnout-info';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;
type CsStatusEvent = Extract<Z21Event, { type: 'event.cs.status' }>;

type LocoInfoEvent = { type: 'event.loco.info.mock' };
type TurnoutInfoEvent = { type: 'event.turnout.info.mock' };

type DecodersMock = {
	decodeLanXLocoInfo: Mock;
	decodeLanXTurnoutInfo: Mock;
	decodeLanXSystem: Mock;
	decodeLanXTrackPower: Mock;
};

const decoders = {
	...locoInfo,
	...turnoutInfo,
	...system,
	...trackPower
} as DecodersMock;

describe('decodeLanXCommand', () => {
	it('returns loco info events for LAN_X_LOCO_INFO', () => {
		const events = decodeLanXCommand('LAN_X_LOCO_INFO', new Uint8Array([0x01]));

		expect(decoders.decodeLanXLocoInfo).toHaveBeenCalledWith(new Uint8Array([0x01]));
		expect(events).toEqual([{ type: 'event.loco.info.mock' }]);
	});

	it('returns turnout info events for LAN_X_TURNOUT_INFO', () => {
		const events = decodeLanXCommand('LAN_X_TURNOUT_INFO', new Uint8Array([0x02]));

		expect(decoders.decodeLanXTurnoutInfo).toHaveBeenCalledWith(new Uint8Array([0x02]));
		expect(events).toEqual([{ type: 'event.turnout.info.mock' }]);
	});

	it('returns cs.status for LAN_X_STATUS_CHANGED', () => {
		const events = decodeLanXCommand('LAN_X_STATUS_CHANGED', new Uint8Array([0x00, 0x00, 0xaa]));

		expect(decoders.decodeLanXSystem).toHaveBeenCalledWith('LAN_X_STATUS_CHANGED', new Uint8Array([0x00, 0x00, 0xaa]));
		expect(events).toEqual([{ type: 'event.cs.status', statusMask: 0xaa }]);
	});

	it('returns track power off for LAN_X_BC_TRACK_POWER_OFF', () => {
		const events = decodeLanXCommand('LAN_X_BC_TRACK_POWER_OFF', new Uint8Array());

		expect(decoders.decodeLanXTrackPower).toHaveBeenCalledWith('LAN_X_BC_TRACK_POWER_OFF', new Uint8Array());
		expect(events).toEqual([{ type: 'event.track.power', on: false }]);
	});

	it('returns track power on for LAN_X_BC_TRACK_POWER_ON', () => {
		const events = decodeLanXCommand('LAN_X_BC_TRACK_POWER_ON', new Uint8Array());

		expect(decoders.decodeLanXTrackPower).toHaveBeenCalledWith('LAN_X_BC_TRACK_POWER_ON', new Uint8Array());
		expect(events).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('returns empty array for unknown commands', () => {
		const events = decodeLanXCommand('LAN_X_UNKNOWN_COMMAND', new Uint8Array());

		expect(events).toEqual([]);
	});
});
