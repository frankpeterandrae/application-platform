/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

import { decodeLanXStoppedPayload } from './stopped';

type Z21StoppedEvent = Extract<Z21Event, { type: 'event.z21.stopped' }>;

describe('decodeLanXStoppedPayload', () => {
	it('returns event.z21.stopped event', () => {
		const events = decodeLanXStoppedPayload() as Z21StoppedEvent[];

		expect(events).toEqual([{ type: 'event.z21.stopped' }]);
	});

	it('returns single event in array', () => {
		const events = decodeLanXStoppedPayload();

		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBe(1);
	});

	it('returns event with correct type property', () => {
		const events = decodeLanXStoppedPayload();

		expect(events[0]).toHaveProperty('type', 'event.z21.stopped');
	});

	it('returns event with only type property', () => {
		const events = decodeLanXStoppedPayload();

		expect(Object.keys(events[0])).toEqual(['type']);
	});

	it('returns consistent output on multiple calls', () => {
		const events1 = decodeLanXStoppedPayload();
		const events2 = decodeLanXStoppedPayload();

		expect(events1).toEqual(events2);
	});

	it('returns new array instance on each call', () => {
		const events1 = decodeLanXStoppedPayload();
		const events2 = decodeLanXStoppedPayload();

		expect(events1).not.toBe(events2);
	});

	it('returns array with immutable event structure', () => {
		const events = decodeLanXStoppedPayload();
		const originalEvent = { ...events[0] };

		events[0].type = 'modified' as any;

		const newEvents = decodeLanXStoppedPayload();
		expect(newEvents[0]).toEqual(originalEvent);
	});
});
