/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

import { decodeLanXFirmwareVersionPayload } from './firmware-version';

type FirmwareVersionEvent = Extract<Z21Event, { type: 'event.firmware.version' }>;

describe('decodeLanXFirmwareVersionPayload', () => {
	it('decodes the documented example payload as firmware version 1.23', () => {
		const payload = new Uint8Array([0x0a, 0x01, 0x23, 0xdb]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(1);
		expect(events[0].minor).toBe(23);
		expect(events[0].raw).toEqual([0x0a, 0x01, 0x23, 0xdb]);
	});

	it('decodes BCD major and minor bytes', () => {
		const payload = new Uint8Array([0x00, 0x25, 0x42]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(25);
		expect(events[0].minor).toBe(42);
		expect(events[0].type).toBe('event.firmware.version');
	});

	it('returns zero for missing minor byte', () => {
		const payload = new Uint8Array([0x00, 0x07]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(7);
		expect(events[0].minor).toBe(0);
	});

	it('handles empty payload gracefully', () => {
		const payload = new Uint8Array([]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events).toHaveLength(1);
		expect(events[0].major).toBe(0);
		expect(events[0].minor).toBe(0);
	});

	it('preserves payload bytes in raw field exactly as provided', () => {
		const payload = new Uint8Array([0xab, 0xcd]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].raw).toEqual([0xab, 0xcd]);
		payload[0] = 0x00;
		expect(events[0].raw[0]).toBe(0xab);
	});

	it('handles payload with additional bytes after DB2', () => {
		const payload = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(34);
		expect(events[0].minor).toBe(56);
		expect(events[0].raw.length).toBe(4);
	});

	it('produces consistent output for same payload', () => {
		const payload = new Uint8Array([0x34, 0x78, 0x90]);

		const events1 = decodeLanXFirmwareVersionPayload(payload);
		const events2 = decodeLanXFirmwareVersionPayload(payload);

		expect(events1[0]).toEqual(events2[0]);
	});

	it('does not modify input payload', () => {
		const payload = new Uint8Array([0x12, 0x34, 0x56]);
		const originalBytes = [payload[0], payload[1], payload[2]];

		decodeLanXFirmwareVersionPayload(payload);

		expect(payload[0]).toBe(originalBytes[0]);
		expect(payload[1]).toBe(originalBytes[1]);
		expect(payload[2]).toBe(originalBytes[2]);
	});
});
