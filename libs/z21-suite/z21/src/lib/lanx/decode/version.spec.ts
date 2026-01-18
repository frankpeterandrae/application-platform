/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

import { decodeLanXVersionPayload } from './version';

type VersionEvent = Extract<Z21Event, { type: 'event.z21.version' }>;

describe('decodeLanXVersionPayload', () => {
	it('decodes version 3.0 correctly', () => {
		const payload = new Uint8Array([0x30, 0x12]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({
			type: 'event.z21.version',
			raw: [0x30, 0x12],
			xbusVersion: 0x30,
			versionString: 'V3.0',
			cmdsId: 0x12
		});
	});

	it('decodes version 3.6 correctly', () => {
		const payload = new Uint8Array([0x36, 0x10]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events).toHaveLength(1);
		expect(events[0]).toEqual({
			type: 'event.z21.version',
			raw: [0x36, 0x10],
			xbusVersion: 0x36,
			versionString: 'V3.6',
			cmdsId: 0x10
		});
	});

	it('decodes version 4.0 correctly', () => {
		const payload = new Uint8Array([0x40, 0xff]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].versionString).toBe('V4.0');
		expect(events[0].xbusVersion).toBe(0x40);
	});

	it('decodes version 1.1 correctly', () => {
		const payload = new Uint8Array([0x11, 0x05]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].versionString).toBe('V1.1');
	});

	it('returns Unknown version when xbusVersion is 0x00', () => {
		const payload = new Uint8Array([0x00, 0x42]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].versionString).toBe('Unknown');
		expect(events[0].xbusVersion).toBe(0x00);
	});

	it('preserves cmds ID in the event', () => {
		const payload = new Uint8Array([0x30, 0xff]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].cmdsId).toBe(0xff);
	});

	it('handles multiple payload bytes and preserves raw array', () => {
		const payload = new Uint8Array([0x25, 0x99, 0xaa, 0xbb]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].raw).toEqual([0x25, 0x99, 0xaa, 0xbb]);
		expect(events[0].xbusVersion).toBe(0x25);
		expect(events[0].cmdsId).toBe(0x99);
	});

	it('decodes version with all nibble combinations correctly', () => {
		const payload = new Uint8Array([0x89, 0x00]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].versionString).toBe('V8.9');
	});

	it('decodes version 2.5 correctly', () => {
		const payload = new Uint8Array([0x25, 0x11]);

		const events = decodeLanXVersionPayload(payload) as VersionEvent[];

		expect(events[0].versionString).toBe('V2.5');
	});

	it('always returns array with single event', () => {
		const payload = new Uint8Array([0x30, 0x10]);

		const events = decodeLanXVersionPayload(payload);

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

	it('event always has type event.z21.version', () => {
		const payload = new Uint8Array([0x40, 0xff]);

		const events = decodeLanXVersionPayload(payload);

		expect(events[0].type).toBe('event.z21.version');
	});
});
