/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { XBusCmd, XHeader } from '@application-platform/z21-shared';
import { describe, expect, it, vi } from 'vitest';

import { type Z21Event } from '../../event/event-types';

import { decodeLanXPayload } from './decoder';
import * as locoInfo from './loco-info';
import * as statusChanged from './status-changed';
import * as stopped from './stopped';
import * as trackPower from './track-power';
import * as turnoutInfo from './turnout-info';
import * as version from './version';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;
type CsStatusEvent = Extract<Z21Event, { type: 'event.z21.status' }>;

type LocoInfoEvent = { type: 'event.loco.info.mock' };
type TurnoutInfoEvent = { type: 'event.turnout.info.mock' };

type DecodersMock = {
	decodeLanXLocoInfoPayload: vi.Mock;
	decodeLanXTurnoutInfoPayload: vi.Mock;
	decodeLanXTrackPowerPayload: vi.Mock;
	decodeLanXStatusChangedPayload: vi.Mock;
	decodeLanXVersionPayload: vi.Mock;
	decodeLanXStoppedPayload: vi.Mock;
};

vi.mock('./loco-info', () => ({
	decodeLanXLocoInfoPayload: vi.fn(() => [{ type: 'event.loco.info.mock' } as LocoInfoEvent])
}));

vi.mock('./turnout-info', () => ({
	decodeLanXTurnoutInfoPayload: vi.fn(() => [{ type: 'event.turnout.info.mock' } as TurnoutInfoEvent])
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
		} as CsStatusEvent
	])
}));

vi.mock('./version', () => ({
	decodeLanXVersionPayload: vi.fn(() => [
		{ type: 'event.x.bus.version', xBusVersionString: 'V1.2', cmdsId: 1, xbusVersion: 0x12, raw: [] }
	])
}));

vi.mock('./stopped', () => ({
	decodeLanXStoppedPayload: vi.fn(() => [{ type: 'event.z21.stopped' }])
}));

describe('decodeLanXPayload', () => {
	// Helper function to create mocked decoders (similar to makeProviders in bootstrap.spec.ts)
	function makeDecoders(): DecodersMock {
		return {
			...locoInfo,
			...turnoutInfo,
			...statusChanged,
			...trackPower,
			...version,
			...stopped
		} as DecodersMock;
	}

	let decoders: DecodersMock;

	beforeEach(() => {
		decoders = makeDecoders();
		resetMocksBeforeEach(decoders);
	});

	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to verify decoder was called with payload
	function expectDecoderCalled(decoder: vi.Mock, payload: Uint8Array): void {
		expect(decoder).toHaveBeenCalledWith(payload);
	}

	// Helper function to verify decoder was called with command name
	function expectDecoderCalledWithCommand(decoder: vi.Mock, commandName: string): void {
		expect(decoder).toHaveBeenCalledWith(commandName);
	}

	// Helper function to verify event array properties
	function expectEventArray(events: Z21Event[], expectedLength?: number): void {
		expect(Array.isArray(events)).toBe(true);
		if (expectedLength !== undefined) {
			expect(events).toHaveLength(expectedLength);
		}
	}

	// Helper function to verify event type
	function expectEventType(event: Z21Event, expectedType: string): void {
		expect(event.type).toBe(expectedType);
	}

	describe('loco info decoding', () => {
		it('returns loco info events for LAN_X_LOCO_INFO', () => {
			const payload = makePayload(0x01);
			const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, payload);

			expectDecoderCalled(decoders.decodeLanXLocoInfoPayload, payload);
			expect(events).toEqual([{ type: 'event.loco.info.mock' }]);
		});

		it('handles large payload data', () => {
			const largeData = makePayload(...Array.from({ length: 255 }, (_, i) => i % 256));
			const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, largeData);

			expectDecoderCalled(decoders.decodeLanXLocoInfoPayload, largeData);
			expectEventArray(events);
		});

		it('returns multiple events when decoder produces multiple events', () => {
			vi.mocked(decoders.decodeLanXLocoInfoPayload).mockReturnValueOnce([
				{ type: 'event.loco.info.mock' },
				{ type: 'event.loco.info.mock' }
			] as any);

			const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, makePayload(0x01));

			expectEventArray(events, 2);
		});

		it('handles zero-length result from decoder', () => {
			vi.mocked(decoders.decodeLanXLocoInfoPayload).mockReturnValueOnce([]);

			const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, makePayload(0x01));

			expect(events).toEqual([]);
		});
	});

	describe('turnout info decoding', () => {
		it('returns turnout info events for LAN_X_TURNOUT_INFO', () => {
			const payload = makePayload(0x02, 0x02);
			const events = decodeLanXPayload(XHeader.TURNOUT_INFO, payload);

			expectDecoderCalled(decoders.decodeLanXTurnoutInfoPayload, payload);
			expect(events).toEqual([{ type: 'event.turnout.info.mock' }]);
		});
	});

	describe('status changed decoding', () => {
		it('returns cs.status for LAN_X_STATUS_CHANGED', () => {
			const payload = makePayload(XBusCmd.STATUS_CHANGED, 0xaa);
			const events = decodeLanXPayload(XHeader.STATUS_CHANGED, payload);

			expectDecoderCalled(decoders.decodeLanXStatusChangedPayload, payload);
			expect(events).toEqual([
				{ type: 'event.z21.status', payload: { emergencyStop: false, powerOn: false, programmingMode: true, shortCircuit: false } }
			]);
		});

		it('preserves event properties from decoder', () => {
			const events = decodeLanXPayload(XHeader.STATUS_CHANGED, makePayload(XBusCmd.STATUS_CHANGED, 0xaa));

			expect(events[0]).toHaveProperty('type', 'event.z21.status');
			expect(events[0]).toHaveProperty('payload');
		});

		it('handles empty payload data', () => {
			const events = decodeLanXPayload(XHeader.STATUS_CHANGED, makePayload());

			expectEventArray(events);
		});
	});

	describe('track power decoding', () => {
		it('returns track power off for LAN_X_BC_TRACK_POWER_OFF', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_TRACK_POWER_OFF));

			expectDecoderCalledWithCommand(decoders.decodeLanXTrackPowerPayload, 'LAN_X_BC_TRACK_POWER_OFF');
			expect(events).toEqual([{ type: 'event.track.power', on: false }]);
		});

		it('returns track power on for LAN_X_BC_TRACK_POWER_ON', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_TRACK_POWER_ON));

			expectDecoderCalledWithCommand(decoders.decodeLanXTrackPowerPayload, 'LAN_X_BC_TRACK_POWER_ON');
			expect(events).toEqual([{ type: 'event.track.power', on: true }]);
		});

		it('returns track power events for LAN_X_BC_PROGRAMMING_MODE', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_BC_PROGRAMMING_MODE));

			expectDecoderCalledWithCommand(decoders.decodeLanXTrackPowerPayload, 'LAN_X_BC_PROGRAMMING_MODE');
			expectEventArray(events);
			expectEventType(events[0], 'event.track.power');
		});

		it('returns track power events for LAN_X_BC_TRACK_SHORT_CIRCUIT', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_TRACK_SHORT_CIRCUIT));

			expectDecoderCalledWithCommand(decoders.decodeLanXTrackPowerPayload, 'LAN_X_BC_TRACK_SHORT_CIRCUIT');
			expectEventArray(events);
			expectEventType(events[0], 'event.track.power');
		});
	});

	describe('version decoding', () => {
		it('returns xBusVersion events for LAN_X_GET_VERSION_ANSWER', () => {
			const payload = makePayload(XBusCmd.GET_VERSION, 0x30, 0x12);
			const events = decodeLanXPayload(0x63, payload);

			expectDecoderCalled(decoders.decodeLanXVersionPayload, payload);
			expect(events).toEqual([{ type: 'event.x.bus.version', xBusVersionString: 'V1.2', cmdsId: 1, xbusVersion: 0x12, raw: [] }]);
		});
	});

	describe('stopped decoding', () => {
		it('returns stopped events for LAN_X_BC_STOPPED', () => {
			const events = decodeLanXPayload(0x81, makePayload(0x81));

			expect(decoders.decodeLanXStoppedPayload).toHaveBeenCalled();
			expect(events).toEqual([{ type: 'event.z21.stopped' }]);
		});
	});

	describe('unknown commands and edge cases', () => {
		it('returns empty array for unknown commands', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.UNKNOWN_COMMAND));

			expect(events).toEqual([]);
		});

		it('returns empty array when no decoder handles command', () => {
			const events = decodeLanXPayload(99 as XHeader, makePayload(0xff));

			expectEventArray(events, 0);
		});
	});

	describe('result validation', () => {
		it('returns array when decoder returns events', () => {
			const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, makePayload(0x01));

			expectEventArray(events);
			expect(events.length).toBeGreaterThan(0);
		});
	});
});
