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
import * as stopped from './stopped';
import * as trackPower from './track-power';
import * as turnoutInfo from './turnout-info';
import * as version from './version';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;

type LocoInfoEvent = { type: 'envet.loco.info.mock' };
type TurnoutInfoEvent = { type: 'envet.turnout.info.mock' };
type DecodersMock = {
	decodeLanXLocoInfoPayload: Mock;
	decodeLanXTurnoutInfoPayload: Mock;
	decodeLanXTrackPowerPayload: Mock;
	decodeLanXStatusChangedPayload: Mock;
	decodeLanXVersionPayload: Mock;
	decodeLanXStoppedPayload: Mock;
};

vi.mock('./loco-info', () => ({
	decodeLanXLocoInfoPayload: vi.fn(() => [{ type: 'envet.loco.info.mock' } as LocoInfoEvent])
}));

vi.mock('./turnout-info', () => ({
	decodeLanXTurnoutInfoPayload: vi.fn(() => [{ type: 'envet.turnout.info.mock' } as TurnoutInfoEvent])
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
	decodeLanXVersionPayload: vi.fn(() => [
		{
			type: 'event.z21.version',
			versionString: 'V1.2',
			cmdsId: 1,
			xbusVersion: 0x12,
			raw: []
		}
	])
}));

vi.mock('./stopped', () => ({
	decodeLanXStoppedPayload: vi.fn(() => [{ type: 'event.z21.stopped' }])
}));

const decoders = {
	...locoInfo,
	...turnoutInfo,
	...statusChanged,
	...trackPower,
	...version,
	...stopped
} as DecodersMock;

describe('decodeLanXCommand', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it('returns loco info events for LAN_X_LOCO_INFO', () => {
		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, new Uint8Array([0x01]));

		expect(decoders.decodeLanXLocoInfoPayload).toHaveBeenCalledWith(new Uint8Array([0x01]));
		expect(events).toEqual([{ type: 'envet.loco.info.mock' }]);
	});

	it('returns turnout info events for LAN_X_TURNOUT_INFO', () => {
		const events = decodeLanXPayload(XHeader.TURNOUT_INFO, new Uint8Array([0x02, 0x02]));

		expect(decoders.decodeLanXTurnoutInfoPayload).toHaveBeenCalledWith(new Uint8Array([0x02, 0x02]));
		expect(events).toEqual([{ type: 'envet.turnout.info.mock' }]);
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

	it('returns track power events for LAN_X_BC_PROGRAMMING_MODE', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_BC_PROGRAMMING_MODE]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_PROGRAMMING_MODE');
		expect(events.length).toBeGreaterThan(0);
		expect(events[0].type).toBe('event.track.power');
	});

	it('returns track power events for LAN_X_BC_TRACK_SHORT_CIRCUIT', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_SHORT_CIRCUIT]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_TRACK_SHORT_CIRCUIT');
		expect(events.length).toBeGreaterThan(0);
		expect(events[0].type).toBe('event.track.power');
	});

	it('returns version events for LAN_X_GET_VERSION_ANSWER', () => {
		const events = decodeLanXPayload(0x63, new Uint8Array([XBusCmd.GET_VERSION, 0x30, 0x12]));

		expect(decoders.decodeLanXVersionPayload).toHaveBeenCalledWith(new Uint8Array([XBusCmd.GET_VERSION, 0x30, 0x12]));
		expect(events).toEqual([{ type: 'event.z21.version', versionString: 'V1.2', cmdsId: 1, xbusVersion: 0x12, raw: [] }]);
	});

	it('returns stopped events for LAN_X_BC_STOPPED', () => {
		const events = decodeLanXPayload(0x81, new Uint8Array([0x81]));

		expect(decoders.decodeLanXStoppedPayload).toHaveBeenCalled();
		expect(events).toEqual([{ type: 'event.z21.stopped' }]);
	});

	it('returns array when decoder returns events', () => {
		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, new Uint8Array([0x01]));

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBeGreaterThan(0);
	});

	it('returns empty array when no decoder handles command', () => {
		const events = decodeLanXPayload(99 as XHeader, new Uint8Array([0xff]));

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(0);
	});

	it('handles empty payload data', () => {
		const events = decodeLanXPayload(XHeader.STATUS_CHANGED, new Uint8Array([]));

		expect(Array.isArray(events)).toBe(true);
	});

	it('handles large payload data', () => {
		const largeData = new Uint8Array(255);
		for (let i = 0; i < largeData.length; i++) {
			largeData[i] = i % 256;
		}
		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, largeData);

		expect(decoders.decodeLanXLocoInfoPayload).toHaveBeenCalledWith(largeData);
		expect(Array.isArray(events)).toBe(true);
	});

	it('preserves event properties from decoder', () => {
		const events = decodeLanXPayload(XHeader.STATUS_CHANGED, new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]));

		expect(events[0]).toHaveProperty('type', 'event.z21.status');
		expect(events[0]).toHaveProperty('payload');
	});

	it('returns multiple events when decoder produces multiple events', () => {
		vi.mocked(decoders.decodeLanXLocoInfoPayload).mockReturnValueOnce([
			{ type: 'envet.loco.info.mock' },
			{ type: 'envet.loco.info.mock' }
		] as any);

		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, new Uint8Array([0x01]));

		expect(events.length).toBe(2);
	});

	it('handles zero-length result from decoder', () => {
		vi.mocked(decoders.decodeLanXLocoInfoPayload).mockReturnValueOnce([]);

		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, new Uint8Array([0x01]));

		expect(events).toEqual([]);
	});

	it('returns track power events for LAN_X_BC_PROGRAMMING_MODE', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_BC_PROGRAMMING_MODE]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_PROGRAMMING_MODE');
		expect(events.length).toBeGreaterThan(0);
		expect(events[0].type).toBe('event.track.power');
	});

	it('returns track power events for LAN_X_BC_TRACK_SHORT_CIRCUIT', () => {
		const events = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_SHORT_CIRCUIT]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledWith('LAN_X_BC_TRACK_SHORT_CIRCUIT');
		expect(events.length).toBeGreaterThan(0);
		expect(events[0].type).toBe('event.track.power');
	});

	it('passes correct data to loco info decoder', () => {
		const testData = new Uint8Array([0x04, 0x7a, 0x00, 0x42, 0x01]);
		decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, testData);

		expect(decoders.decodeLanXLocoInfoPayload).toHaveBeenCalledWith(testData);
	});

	it('passes correct data to turnout info decoder', () => {
		const testData = new Uint8Array([0x02, 0x03]);
		decodeLanXPayload(XHeader.TURNOUT_INFO, testData);

		expect(decoders.decodeLanXTurnoutInfoPayload).toHaveBeenCalledWith(testData);
	});

	it('passes correct data to status changed decoder', () => {
		const testData = new Uint8Array([XBusCmd.STATUS_CHANGED, 0x56]);
		decodeLanXPayload(XHeader.STATUS_CHANGED, testData);

		expect(decoders.decodeLanXStatusChangedPayload).toHaveBeenCalledWith(testData);
	});

	it('returns array when decoder returns events', () => {
		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, new Uint8Array([0x01]));

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBeGreaterThan(0);
	});

	it('returns empty array when no decoder handles command', () => {
		const events = decodeLanXPayload(99 as XHeader, new Uint8Array([0xff]));

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(0);
	});

	it('handles empty payload data', () => {
		const events = decodeLanXPayload(XHeader.STATUS_CHANGED, new Uint8Array([]));

		expect(Array.isArray(events)).toBe(true);
	});

	it('handles large payload data', () => {
		const largeData = new Uint8Array(255);
		for (let i = 0; i < largeData.length; i++) {
			largeData[i] = i % 256;
		}
		const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, largeData);

		expect(decoders.decodeLanXLocoInfoPayload).toHaveBeenCalledWith(largeData);
		expect(Array.isArray(events)).toBe(true);
	});

	it('preserves event properties from decoder', () => {
		const events = decodeLanXPayload(XHeader.STATUS_CHANGED, new Uint8Array([XBusCmd.STATUS_CHANGED, 0xaa]));

		expect(events[0]).toHaveProperty('type', 'event.z21.status');
		expect(events[0]).toHaveProperty('payload');
	});

	it('handles all broadcast track power commands', () => {
		const offEvents = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_POWER_OFF]));
		const onEvents = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_POWER_ON]));
		const progEvents = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_BC_PROGRAMMING_MODE]));
		const shortEvents = decodeLanXPayload(XHeader.BROADCAST, new Uint8Array([XBusCmd.BC_TRACK_SHORT_CIRCUIT]));

		expect(decoders.decodeLanXTrackPowerPayload).toHaveBeenCalledTimes(4);
		expect(Array.isArray(offEvents)).toBe(true);
		expect(Array.isArray(onEvents)).toBe(true);
		expect(Array.isArray(progEvents)).toBe(true);
		expect(Array.isArray(shortEvents)).toBe(true);
	});
});
