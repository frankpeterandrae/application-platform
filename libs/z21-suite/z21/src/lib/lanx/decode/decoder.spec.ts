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
import * as version from './version';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;
type Z21StatusEvent = Extract<Z21Event, { type: 'event.z21.status' }>;

type LocoInfoEvent = { type: 'loco.info.mock' };
type TurnoutInfoEvent = { type: 'turnout.info.mock' };
type DecodersMock = {
	decodeLanXLocoInfoPayload: Mock;
	decodeLanXTurnoutInfoPayload: Mock;
	decodeLanXTrackPowerPayload: Mock;
	decodeLanXStatusChangedPayload: Mock;
	decodeLanXVersionPayload: Mock;
};

vi.mock('./loco-info', () => ({
	decodeLanXLocoInfoPayload: vi.fn(() => [{ type: 'loco.info.mock' } as LocoInfoEvent])
}));

vi.mock('./turnout-info', () => ({
	decodeLanXTurnoutInfoPayload: vi.fn(() => [{ type: 'turnout.info.mock' } as TurnoutInfoEvent])
}));

vi.mock('./track-power', () => ({
	decodeLanXTrackPowerPayload: vi.fn((command: string, _data: Uint8Array) => [
		{ type: 'event.track.power', on: command === 'LAN_X_BC_TRACK_POWER_ON' } as TrackPowerEvent
	])
}));

vi.mock('./status-changed', () => ({
	decodeLanXStatusChangedPayload: vi.fn((_data: Uint8Array) => [
		{
			type: 'event.z21.status',
			payload: { emergencyStop: false, powerOn: false, programmingMode: true, shortCircuit: false }
		}
	])
}));

vi.mock('./version', () => ({
	decodeLanXVersionPayload: vi.fn((payload: Uint8Array) => [
		{
			type: 'event.z21.version',
			raw: Array.from(payload),
			xbusVersion: payload[0],
			versionString: `V${(payload[0] & 0xf0) >> 4}.${payload[0] & 0x0f}`,
			cmdsId: payload[1]
		}
	])
}));

const decoders = {
	...locoInfo,
	...turnoutInfo,
	...statusChanged,
	...trackPower,
	...version
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

	it('returns event.z21.status for LAN_X_STATUS_CHANGED', () => {
		const events = decodeLanXPayload(XHeader.STATUS_CHANGED, new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]));

		expect(decoders.decodeLanXStatusChangedPayload).toHaveBeenCalledWith(new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]));
		expect(events).toEqual([
			{ type: 'event.z21.status', payload: { emergencyStop: false, powerOn: false, programmingMode: true, shortCircuit: false } }
		]);
	});

	it('returns track power off for LAN_X_BC_TRACK_POWER_OFF', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_POWER_OFF]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_TRACK_POWER_OFF');
		expect(events).toEqual([{ type: 'event.track.power', on: false }]);
	});

	it('returns track power on for LAN_X_BC_TRACK_POWER_ON', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_POWER_ON]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_TRACK_POWER_ON');
		expect(events).toEqual([{ type: 'event.track.power', on: true }]);
	});

	it('returns empty array for unknown commands', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.UNKNOWN_COMMAND]));

		expect(events).toEqual([]);
	});

	it('returns event.z21.version for LAN_X_GET_VERSION_ANSWER', () => {
		const payload = new Uint8Array([33, 2, 1]);

		const events = decodeLanXPayload(XHeader.VESION_ANSWER, payload);

		expect(decoders.decodeLanXVersionPayload).toHaveBeenCalledWith(payload);
		expect(events).toEqual([
			{
				type: 'event.z21.version',
				raw: [33, 2, 1],
				xbusVersion: 33,
				versionString: 'V2.1',
				cmdsId: 2
			}
		] as any);
	});
});
