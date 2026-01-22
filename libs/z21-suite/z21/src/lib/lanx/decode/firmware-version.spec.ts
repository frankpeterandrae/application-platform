/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

import { decodeLanXFirmwareVersionPayload } from './firmware-version';

type FirmwareVersionEvent = Extract<Z21Event, { event: 'system.event.firmware.version' }>;

describe('decodeLanXFirmwareVersionPayload', () => {
	// Helper function to create payload from bytes (similar to helper functions in bootstrap.spec.ts)
	function makePayload(...bytes: number[]): Uint8Array {
		return new Uint8Array(bytes);
	}

	// Helper function to extract first firmware version event from result
	function extractFirmwareVersion(payload: Uint8Array): FirmwareVersionEvent {
		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];
		return events[0];
	}

	// Helper function to verify firmware version values
	function expectFirmwareVersion(event: FirmwareVersionEvent, major: number, minor: number): void {
		expect(event.payload.major).toBe(major);
		expect(event.payload.minor).toBe(minor);
		expect(event.event).toBe('system.event.firmware.version');
	}

	// Helper function to verify raw payload preservation
	function expectRawPayload(event: FirmwareVersionEvent, expectedBytes: number[]): void {
		expect(event.payload.raw).toEqual(expectedBytes);
	}

	describe('BCD decoding', () => {
		it('decodes the documented example payload as firmware version 1.23', () => {
			const event = extractFirmwareVersion(makePayload(0x0a, 0x01, 0x23, 0xdb));

			expectFirmwareVersion(event, 1, 23);
			expectRawPayload(event, [0x0a, 0x01, 0x23, 0xdb]);
		});

		it('decodes BCD major and minor bytes', () => {
			const event = extractFirmwareVersion(makePayload(0x00, 0x25, 0x42));

			expectFirmwareVersion(event, 25, 42);
		});

		it('decodes major version from DB1 (index 1)', () => {
			const event = extractFirmwareVersion(makePayload(0xff, 0x99, 0x00));

			expect(event.payload.major).toBe(99);
		});

		it('decodes minor version from DB2 (index 2)', () => {
			const event = extractFirmwareVersion(makePayload(0xff, 0x00, 0x88));

			expect(event.payload.minor).toBe(88);
		});
	});

	describe('edge cases and missing data', () => {
		it('returns zero for missing minor byte', () => {
			const event = extractFirmwareVersion(makePayload(0x00, 0x07));

			expectFirmwareVersion(event, 7, 0);
		});

		it('handles empty payload gracefully', () => {
			const events = decodeLanXFirmwareVersionPayload(makePayload()) as FirmwareVersionEvent[];

			expect(events).toHaveLength(1);
			expectFirmwareVersion(events[0], 0, 0);
		});

		it('handles single byte payload', () => {
			const event = extractFirmwareVersion(makePayload(0x00));

			expectFirmwareVersion(event, 0, 0);
		});

		it('handles payload with additional bytes after DB2', () => {
			const event = extractFirmwareVersion(makePayload(0x12, 0x34, 0x56, 0x78));

			expectFirmwareVersion(event, 34, 56);
			expect(event.payload.raw.length).toBe(4);
		});
	});

	describe('payload preservation', () => {
		it('preserves payload bytes in raw field exactly as provided', () => {
			const payload = makePayload(0xab, 0xcd);
			const event = extractFirmwareVersion(payload);

			expectRawPayload(event, [0xab, 0xcd]);

			// Verify immutability - modifying original should not affect event
			payload[0] = 0x00;
			expect(event.payload.raw[0]).toBe(0xab);
		});

		it('preserves all payload bytes including header', () => {
			const event = extractFirmwareVersion(makePayload(0x0a, 0x01, 0x23, 0xdb, 0xff));

			expectRawPayload(event, [0x0a, 0x01, 0x23, 0xdb, 0xff]);
		});

		it('does not modify input payload', () => {
			const payload = makePayload(0x12, 0x34, 0x56);
			const originalBytes = [payload[0], payload[1], payload[2]];

			decodeLanXFirmwareVersionPayload(payload);

			expect(payload[0]).toBe(originalBytes[0]);
			expect(payload[1]).toBe(originalBytes[1]);
			expect(payload[2]).toBe(originalBytes[2]);
		});
	});

	describe('consistency', () => {
		it('produces consistent output for same payload', () => {
			const payload = makePayload(0x34, 0x78, 0x90);

			const events1 = decodeLanXFirmwareVersionPayload(payload);
			const events2 = decodeLanXFirmwareVersionPayload(payload);

			expect(events1[0]).toEqual(events2[0]);
		});

		it('produces single event in array', () => {
			const events = decodeLanXFirmwareVersionPayload(makePayload(0x00, 0x12, 0x34)) as FirmwareVersionEvent[];

			expect(events).toHaveLength(1);
		});
	});

	describe('version boundaries', () => {
		it('handles version 0.0', () => {
			const event = extractFirmwareVersion(makePayload(0x00, 0x00, 0x00));

			expectFirmwareVersion(event, 0, 0);
		});

		it('handles maximum BCD values (99.99)', () => {
			const event = extractFirmwareVersion(makePayload(0x00, 0x99, 0x99));

			expectFirmwareVersion(event, 99, 99);
		});
	});
});
