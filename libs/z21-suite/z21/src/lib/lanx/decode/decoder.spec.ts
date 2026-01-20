/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DeepMocked, resetMocksBeforeEach } from '@application-platform/shared-node-test';
import { XBusCmd, XHeader, Z21StatusEvent, Z21StoppedEvent, Z21VersionEvent } from '@application-platform/z21-shared';
import { describe, expect, it, vi } from 'vitest';

import { type Z21Event } from '../../event/event-types';

import { decodeLanXPayload } from './decoder';

type TrackPowerEvent = Extract<Z21Event, { type: 'event.track.power' }>;

type LocoInfoEvent = { type: 'event.loco.info.mock' };
type TurnoutInfoEvent = { type: 'event.turnout.info.mock' };

// Use hoist-safe mock factories that return vi.fn() placeholders. We'll import
// the mocked modules inside beforeEach to obtain the vi.fn references and
// configure their behaviors for each test.
vi.mock('./loco-info', () => ({ decodeLanXLocoInfoPayload: vi.fn() }));
vi.mock('./turnout-info', () => ({ decodeLanXTurnoutInfoPayload: vi.fn() }));
vi.mock('./track-power', () => ({ decodeLanXTrackPowerPayload: vi.fn() }));
vi.mock('./status-changed', () => ({ decodeLanXStatusChangedPayload: vi.fn() }));
vi.mock('./version', () => ({ decodeLanXVersionPayload: vi.fn() }));
vi.mock('./stopped', () => ({ decodeLanXStoppedPayload: vi.fn() }));

type DecodersMock = {
	decodeLanXLocoInfoPayload: DeepMocked<(payload: Uint8Array) => Z21Event[]>;
	decodeLanXTurnoutInfoPayload: DeepMocked<(payload: Uint8Array) => Z21Event[]>;
	decodeLanXTrackPowerPayload: DeepMocked<(commandName: string, payload?: Uint8Array) => Z21Event[]>;
	decodeLanXStatusChangedPayload: DeepMocked<(payload: Uint8Array) => Z21Event[]>;
	decodeLanXVersionPayload: DeepMocked<(payload: Uint8Array) => Z21Event[]>;
	decodeLanXStoppedPayload: DeepMocked<() => Z21Event[]>;
};
let decoders: DecodersMock;

beforeEach(async () => {
	// Import the mocked modules to obtain the vi.fn() references created by
	// the hoisted mock factories above. Assign those functions into the
	// decoders object so tests can configure and assert them uniformly.
	const locoModule = await import('./loco-info');
	const turnoutModule = await import('./turnout-info');
	const trackPowerModule = await import('./track-power');
	const statusModule = await import('./status-changed');
	const versionModule = await import('./version');
	const stoppedModule = await import('./stopped');

	decoders = {
		decodeLanXLocoInfoPayload: locoModule.decodeLanXLocoInfoPayload as any,
		decodeLanXTurnoutInfoPayload: turnoutModule.decodeLanXTurnoutInfoPayload as any,
		decodeLanXTrackPowerPayload: trackPowerModule.decodeLanXTrackPowerPayload as any,
		decodeLanXStatusChangedPayload: statusModule.decodeLanXStatusChangedPayload as any,
		decodeLanXVersionPayload: versionModule.decodeLanXVersionPayload as any,
		decodeLanXStoppedPayload: stoppedModule.decodeLanXStoppedPayload as any
	};

	resetMocksBeforeEach(decoders);

	decoders.decodeLanXLocoInfoPayload.mockReturnValue([{ type: 'event.loco.info.mock' } as LocoInfoEvent]);
	decoders.decodeLanXTurnoutInfoPayload.mockReturnValue([{ type: 'event.turnout.info.mock' } as TurnoutInfoEvent]);
	decoders.decodeLanXTrackPowerPayload.mockImplementation((command: string) => [
		{ type: 'event.track.power', on: command === 'LAN_X_BC_TRACK_POWER_ON' } as TrackPowerEvent
	]);
	decoders.decodeLanXStatusChangedPayload.mockReturnValue([
		{
			type: 'event.z21.status',
			payload: { emergencyStop: false, powerOn: false, programmingMode: true, shortCircuit: false }
		} as Z21StatusEvent
	]);
	decoders.decodeLanXVersionPayload.mockReturnValue([
		{ type: 'event.x.bus.version', xBusVersionString: 'V1.2', cmdsId: 1, xbusVersion: 0x12, raw: [] } as Z21VersionEvent
	]);
	decoders.decodeLanXStoppedPayload.mockReturnValue([{ type: 'event.z21.stopped' } as Z21StoppedEvent]);
});

// Note: instead of module-level vi.mock, we create DeepMocks at runtime
// in makeDecoders() and assign the mock functions onto the real required modules.
describe('decodeLanXPayload', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to verify decoder was called with payload
	function expectDecoderCalled(decoder: any, payload: Uint8Array): void {
		expect(decoder).toBeDefined();
		expect(Array.isArray((decoder as vi.Mock).mock?.calls)).toBe(true);
		expect((decoder as vi.Mock).mock.calls[0][0]).toEqual(payload);
	}

	// Helper function to verify decoder was called with command name
	function expectDecoderCalledWithCommand(decoder: any, commandName: string): void {
		expect(decoder).toBeDefined();
		expect(Array.isArray((decoder as vi.Mock).mock?.calls)).toBe(true);
		expect((decoder as vi.Mock).mock.calls[0][0]).toEqual(commandName);
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

			expect(events).toEqual([{ type: 'event.loco.info.mock' }]);
		});

		it('handles large payload data', () => {
			const largeData = makePayload(...Array.from({ length: 255 }, (_, i) => i % 256));
			const events = decodeLanXPayload(XHeader.LOCO_INFO_ANSWER, largeData);

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

			expect(events).toEqual([{ type: 'event.turnout.info.mock' }]);
		});
	});

	describe('status changed decoding', () => {
		it('returns z21.status for LAN_X_STATUS_CHANGED', () => {
			const payload = makePayload(XBusCmd.STATUS_CHANGED, 0xaa);
			const events = decodeLanXPayload(XHeader.STATUS_CHANGED, payload);

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

			expect(events).toEqual([{ type: 'event.track.power', on: false }]);
		});

		it('returns track power on for LAN_X_BC_TRACK_POWER_ON', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_TRACK_POWER_ON));

			expect(events).toEqual([{ type: 'event.track.power', on: true }]);
		});

		it('returns track power events for LAN_X_BC_PROGRAMMING_MODE', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_BC_PROGRAMMING_MODE));

			expectEventArray(events);
			expectEventType(events[0], 'event.track.power');
		});

		it('returns track power events for LAN_X_BC_TRACK_SHORT_CIRCUIT', () => {
			const events = decodeLanXPayload(XHeader.BROADCAST, makePayload(XBusCmd.BC_TRACK_SHORT_CIRCUIT));

			expectEventArray(events);
			expectEventType(events[0], 'event.track.power');
		});
	});

	describe('version decoding', () => {
		it('returns xBusVersion events for LAN_X_GET_VERSION_ANSWER', () => {
			const payload = makePayload(XBusCmd.GET_VERSION, 0x30, 0x12);
			const events = decodeLanXPayload(0x63, payload);

			expect(events).toEqual([{ type: 'event.x.bus.version', xBusVersionString: 'V1.2', cmdsId: 1, xbusVersion: 0x12, raw: [] }]);
		});
	});

	describe('stopped decoding', () => {
		it('returns stopped events for LAN_X_BC_STOPPED', () => {
			const events = decodeLanXPayload(0x81, makePayload(0x81));

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
