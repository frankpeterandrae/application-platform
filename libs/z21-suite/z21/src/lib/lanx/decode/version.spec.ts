/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21VersionEvent, type Z21Event } from '@application-platform/z21-shared';

import { decodeLanXVersionPayload } from './version';

type VersionEvent = Extract<Z21Event, { event: 'system.event.x.bus.version' }>;

describe('decodeLanXVersionPayload', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to extract first version event from result
	function extractVersionEvent(payload: Uint8Array): VersionEvent {
		const events = decodeLanXVersionPayload(payload) as VersionEvent[];
		return events[0];
	}

	// Helper function to verify version event properties
	function expectVersionEvent(
		event: VersionEvent,
		expectedValues: {
			xBusVersion: number;
			xBusVersionString: string;
			cmdsId: number;
			raw?: number[];
		}
	): void {
		expect(event.event).toBe('system.event.x.bus.version');
		expect(event.payload.xBusVersion).toBe(expectedValues.xBusVersion);
		expect(event.payload.xBusVersionString).toBe(expectedValues.xBusVersionString);
		expect(event.payload.cmdsId).toBe(expectedValues.cmdsId);
		if (expectedValues.raw !== undefined) {
			expect(event.payload.raw).toEqual(expectedValues.raw);
		}
	}

	// Helper function to verify event array structure
	function expectEventArray(events: Z21VersionEvent[]): void {
		expect(Array.isArray(events)).toBe(true);
		expect(events).toHaveLength(1);
	}

	describe('version string formatting', () => {
		it('decodes version 3.0 correctly', () => {
			const payload = makePayload(0x30, 0x12);
			const event = extractVersionEvent(payload);

			expectVersionEvent(event, {
				xBusVersion: 0x30,
				xBusVersionString: 'V3.0',
				cmdsId: 0x12,
				raw: [0x30, 0x12]
			});
		});

		it('decodes version 3.6 correctly', () => {
			const payload = makePayload(0x36, 0x10);
			const event = extractVersionEvent(payload);

			expectVersionEvent(event, {
				xBusVersion: 0x36,
				xBusVersionString: 'V3.6',
				cmdsId: 0x10,
				raw: [0x36, 0x10]
			});
		});

		it('decodes version 4.0 correctly', () => {
			const event = extractVersionEvent(makePayload(0x40, 0xff));

			expect(event.payload.xBusVersionString).toBe('V4.0');
			expect(event.payload.xBusVersion).toBe(0x40);
		});

		it('decodes version 1.1 correctly', () => {
			const event = extractVersionEvent(makePayload(0x11, 0x05));

			expect(event.payload.xBusVersionString).toBe('V1.1');
		});

		it('decodes version 2.5 correctly', () => {
			const event = extractVersionEvent(makePayload(0x25, 0x11));

			expect(event.payload.xBusVersionString).toBe('V2.5');
		});

		it('decodes version with all nibble combinations correctly', () => {
			const event = extractVersionEvent(makePayload(0x89, 0x00));

			expect(event.payload.xBusVersionString).toBe('V8.9');
		});

		it('returns Unknown version when xBusVersion is 0x00', () => {
			const event = extractVersionEvent(makePayload(0x00, 0x42));

			expect(event.payload.xBusVersionString).toBe('Unknown');
			expect(event.payload.xBusVersion).toBe(0x00);
		});
	});

	describe('cmds ID preservation', () => {
		it('preserves cmds ID in the event', () => {
			const event = extractVersionEvent(makePayload(0x30, 0xff));

			expect(event.payload.cmdsId).toBe(0xff);
		});

		it('preserves cmds ID for various values', () => {
			const testCases = [{ cmdsId: 0x00 }, { cmdsId: 0x12 }, { cmdsId: 0x99 }, { cmdsId: 0xff }];

			for (const { cmdsId } of testCases) {
				const event = extractVersionEvent(makePayload(0x30, cmdsId));
				expect(event.payload.cmdsId).toBe(cmdsId);
			}
		});
	});

	describe('raw payload preservation', () => {
		it('handles multiple payload bytes and preserves raw array', () => {
			const event = extractVersionEvent(makePayload(0x25, 0x99, 0xaa, 0xbb));

			expect(event.payload.raw).toEqual([0x25, 0x99, 0xaa, 0xbb]);
			expect(event.payload.xBusVersion).toBe(0x25);
			expect(event.payload.cmdsId).toBe(0x99);
		});

		it('preserves exact payload bytes', () => {
			const payload = makePayload(0x30, 0x12);
			const event = extractVersionEvent(payload);

			expect(event.payload.raw).toEqual([0x30, 0x12]);
		});

		it('does not modify input payload', () => {
			const payload = makePayload(0x12, 0x34);
			const originalBytes = [payload[0], payload[1]];

			decodeLanXVersionPayload(payload);

			expect(payload[0]).toBe(originalBytes[0]);
			expect(payload[1]).toBe(originalBytes[1]);
		});
	});

	describe('event structure', () => {
		it('always returns array with single event', () => {
			const events = decodeLanXVersionPayload(makePayload(0x30, 0x10));

			expectEventArray(events);
		});

		it('event always has type x.bus.version', () => {
			const event = extractVersionEvent(makePayload(0x40, 0xff));

			expect(event.event).toBe('system.event.x.bus.version');
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same payload', () => {
			const payload = makePayload(0x30, 0x12);

			const events1 = decodeLanXVersionPayload(payload);
			const events2 = decodeLanXVersionPayload(payload);

			expect(events1[0]).toEqual(events2[0]);
		});
	});

	describe('edge cases', () => {
		it('handles version 0.0', () => {
			const event = extractVersionEvent(makePayload(0x00, 0x00));

			expectVersionEvent(event, {
				xBusVersion: 0x00,
				xBusVersionString: 'Unknown',
				cmdsId: 0x00
			});
		});

		it('handles maximum nibble values (9.9)', () => {
			const event = extractVersionEvent(makePayload(0x99, 0x00));

			expect(event.payload.xBusVersionString).toBe('V9.9');
		});

		it('handles single digit major version', () => {
			const event = extractVersionEvent(makePayload(0x05, 0x00));

			expect(event.payload.xBusVersionString).toBe('V0.5');
		});
	});
});
