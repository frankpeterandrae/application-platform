/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

import { decodeLanXFirmwareVersionPayload } from './firmware-version';

type FirmwareVersionEvent = Extract<Z21Event, { type: 'event.firmware.version' }>;

describe('decodeLanXFirmwareVersionPayload', () => {
	it('decodes firmware version 1.0 correctly', () => {
		const payload = new Uint8Array([0x10, 0x01]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({
			type: 'event.firmware.version',
			raw: [0x10, 0x01],
			major: 0x10,
			minor: 0x01
		});
	});

	it('decodes firmware version 2.5 correctly', () => {
		const payload = new Uint8Array([0x25, 0x42]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events).toHaveLength(1);
		expect(events[0].major).toBe(0x25);
		expect(events[0].minor).toBe(0x42);
		expect(events[0].type).toBe('event.firmware.version');
	});

	it('decodes firmware version 3.0 correctly', () => {
		const payload = new Uint8Array([0x30, 0x00]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0x30);
		expect(events[0].minor).toBe(0x00);
	});

	it('decodes firmware version 4.9 correctly', () => {
		const payload = new Uint8Array([0x49, 0xff]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0x49);
		expect(events[0].minor).toBe(0xff);
	});

	it('returns event with raw bytes as array', () => {
		const payload = new Uint8Array([0x20, 0x15]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].raw).toEqual([0x20, 0x15]);
		expect(Array.isArray(events[0].raw)).toBe(true);
	});

	it('returns single event in array', () => {
		const payload = new Uint8Array([0x11, 0x05]);

		const events = decodeLanXFirmwareVersionPayload(payload);

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

	it('decodes minimum major and minor values', () => {
		const payload = new Uint8Array([0x00, 0x00]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0x00);
		expect(events[0].minor).toBe(0x00);
	});

	it('decodes maximum major and minor values', () => {
		const payload = new Uint8Array([0xff, 0xff]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0xff);
		expect(events[0].minor).toBe(0xff);
	});

	it('preserves payload bytes in raw field exactly as provided', () => {
		const payload = new Uint8Array([0xab, 0xcd]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].raw[0]).toBe(0xab);
		expect(events[0].raw[1]).toBe(0xcd);
	});

	it('handles payload with additional bytes after first two', () => {
		const payload = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0x12);
		expect(events[0].minor).toBe(0x34);
		expect(events[0].raw.length).toBe(4);
	});

	it('returns event with correct type property', () => {
		const payload = new Uint8Array([0x21, 0x99]);

		const events = decodeLanXFirmwareVersionPayload(payload);

		expect(events[0].type).toBe('event.firmware.version');
	});

	it('creates independent raw array from payload', () => {
		const payload = new Uint8Array([0x50, 0x60]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		payload[0] = 0xff;
		expect(events[0].raw[0]).toBe(0x50);
		expect(events[0].raw).toEqual([0x50, 0x60]);
	});

	it('handles payload with single byte gracefully', () => {
		const payload = new Uint8Array([0x12]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0x12);
		expect(events[0].minor).toBe(undefined);
	});

	it('handles empty payload gracefully', () => {
		const payload = new Uint8Array([]);

		const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

		expect(events).toHaveLength(1);
		expect(events[0].type).toBe('event.firmware.version');
	});

	it('decodes all possible major version values', () => {
		for (let major = 0; major <= 0xff; major++) {
			const payload = new Uint8Array([major, 0x00]);

			const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

			expect(events[0].major).toBe(major);
		}
	});

	it('decodes all possible minor version values', () => {
		for (let minor = 0; minor <= 0xff; minor++) {
			const payload = new Uint8Array([0x00, minor]);

			const events = decodeLanXFirmwareVersionPayload(payload) as FirmwareVersionEvent[];

			expect(events[0].minor).toBe(minor);
		}
	});

	it('produces consistent output for same payload', () => {
		const payload = new Uint8Array([0x34, 0x78]);

		const events1 = decodeLanXFirmwareVersionPayload(payload);
		const events2 = decodeLanXFirmwareVersionPayload(payload);

		expect(events1[0]).toEqual(events2[0]);
	});

	it('does not modify input payload', () => {
		const payload = new Uint8Array([0x12, 0x34]);
		const originalBytes = [payload[0], payload[1]];

		decodeLanXFirmwareVersionPayload(payload);

		expect(payload[0]).toBe(originalBytes[0]);
		expect(payload[1]).toBe(originalBytes[1]);
	});

	it('handles payload from buffer view', () => {
		const buffer = new ArrayBuffer(2);
		const view = new Uint8Array(buffer);
		view[0] = 0x42;
		view[1] = 0x11;

		const events = decodeLanXFirmwareVersionPayload(view) as FirmwareVersionEvent[];

		expect(events[0].major).toBe(0x42);
		expect(events[0].minor).toBe(0x11);
	});
});
