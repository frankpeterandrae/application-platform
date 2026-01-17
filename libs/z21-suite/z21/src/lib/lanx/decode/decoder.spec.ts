/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { XBusCmd, XHeader } from '@application-platform/z21-shared';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { type Z21Event } from '../../event/event-types';

import { decodeLanXPayload } from './decoder';
import * as locoInfo from './loco-info';
import * as statusChanged from './status-changed';
import * as trackPower from './track-power';
import * as turnoutInfo from './turnout-info';

type TrackPowerEvent = Extract<Z21Event, { type: 'track.power' }>;
type CsStatusEvent = Extract<Z21Event, { type: 'cs.status' }>;

type LocoInfoEvent = { type: 'loco.info.mock' };
type TurnoutInfoEvent = { type: 'turnout.info.mock' };
type DecodersMock = {
	decodeLanXLocoInfoPayload: Mock;
	decodeLanXTurnoutInfoPayload: Mock;
	decodeLanXTrackPowerPayload: Mock;
	decodeLanXStatusChangedPayload: Mock;
};

vi.mock('./loco-info', () => ({
	decodeLanXLocoInfoPayload: vi.fn(() => [{ type: 'loco.info.mock' } as LocoInfoEvent])
}));

vi.mock('./turnout-info', () => ({
	decodeLanXTurnoutInfoPayload: vi.fn(() => [{ type: 'turnout.info.mock' } as TurnoutInfoEvent])
}));

vi.mock('./track-power', () => ({
	decodeLanXTrackPowerPayload: vi.fn((command: string, _data: Uint8Array) => [
		{ type: 'track.power', on: command === 'LAN_X_BC_TRACK_POWER_ON' } as TrackPowerEvent
	])
}));

vi.mock('./status-changed', () => ({
	decodeLanXStatusChangedPayload: vi.fn((_data: Uint8Array) => [{ type: 'cs.status', statusMask: 0xaa } as CsStatusEvent])
}));

const decoders = {
	...locoInfo,
	...turnoutInfo,
	...statusChanged,
	...trackPower
} as DecodersMock;

describe('decodeLanXCommand', () => {
	it('returns loco info events for LAN_X_LOCO_INFO', () => {
		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, new Uint8Array([0x01]));

		expect(decoders.decodeLanXLocoInfoPayload).toHaveBeenCalledWith(new Uint8Array([0x01]));
		expect(events).toEqual([{ type: 'loco.info.mock' }]);
	});

	it('returns turnout info events for LAN_X_TURNOUT_INFO', () => {
		const events = decodeLanXPayload(XHeader.TURNOUT_INFO, new Uint8Array([0x02, 0x02]));

		expect(decoders.decodeLanXTurnoutInfoPayload).toHaveBeenCalledWith(new Uint8Array([0x02, 0x02]));
		expect(events).toEqual([{ type: 'turnout.info.mock' }]);
	});

	it('returns cs.status for LAN_X_STATUS_CHANGED', () => {
		const events = decodeLanXPayload(XHeader.STATUS_CHANGED, new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]));

		expect(decoders.decodeLanXStatusChangedPayload).toHaveBeenCalledWith(new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]));
		expect(events).toEqual([{ type: 'cs.status', statusMask: 0xaa }]);
	});

	it('returns track power off for LAN_X_BC_TRACK_POWER_OFF', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_POWER_OFF]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_TRACK_POWER_OFF');
		expect(events).toEqual([{ type: 'track.power', on: false }]);
	});

	it('returns track power on for LAN_X_BC_TRACK_POWER_ON', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_POWER_ON]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_TRACK_POWER_ON');
		expect(events).toEqual([{ type: 'track.power', on: true }]);
	});

	it('returns empty array for unknown commands', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.UNKNOWN_COMMAND]));

		expect(events).toEqual([]);
	});
});
