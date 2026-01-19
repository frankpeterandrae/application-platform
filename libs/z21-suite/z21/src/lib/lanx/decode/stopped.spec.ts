/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

import { decodeLanXStoppedPayload } from './stopped';

type Z21StoppedEvent = Extract<Z21Event, { type: 'event.z21.stopped' }>;

describe('decodeLanXStoppedPayload', () => {
	// Helper function to extract first stopped event from result (similar to helper functions in bootstrap.spec.ts)
	function extractStoppedEvent(): Z21StoppedEvent {
		const events = decodeLanXStoppedPayload() as Z21StoppedEvent[];
		return events[0];
	}

	// Helper function to verify event structure
	function expectStoppedEvent(event: Z21StoppedEvent): void {
		expect(event.type).toBe('event.z21.stopped');
		expect(Object.keys(event)).toEqual(['type']);
	}

	// Helper function to verify event array structure
	function expectEventArray(events: Z21Event[]): void {
		expect(Array.isArray(events)).toBe(true);
		expect(events).toHaveLength(1);
	}

	describe('event structure', () => {
		it('returns cs.stopped event', () => {
			const events = decodeLanXStoppedPayload() as Z21StoppedEvent[];

			expect(events).toEqual([{ type: 'event.z21.stopped' }]);
		});

		it('returns event with correct type property', () => {
			const event = extractStoppedEvent();

			expect(event.type).toBe('event.z21.stopped');
		});

		it('returns event with only type property', () => {
			const event = extractStoppedEvent();

			expectStoppedEvent(event);
		});

		it('returns single event in array', () => {
			const events = decodeLanXStoppedPayload();

			expectEventArray(events);
		});
	});

	describe('consistency', () => {
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
	});

	describe('immutability', () => {
		it('returns array with immutable event structure', () => {
			const events = decodeLanXStoppedPayload();
			const originalEvent = { ...events[0] };

			events[0].type = 'modified' as any;

			const newEvents = decodeLanXStoppedPayload();
			expect(newEvents[0]).toEqual(originalEvent);
		});

		it('does not share event object references between calls', () => {
			const events1 = decodeLanXStoppedPayload();
			const events2 = decodeLanXStoppedPayload();

			expect(events1[0]).not.toBe(events2[0]);
			expect(events1[0]).toEqual(events2[0]);
		});
	});
});
