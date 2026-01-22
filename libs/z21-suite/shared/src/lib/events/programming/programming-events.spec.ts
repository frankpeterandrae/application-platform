/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { CvNackEvent } from './cv-nack-event';
import type { CvResultEvent } from './cv-result-event';

describe('Programming Event Types', () => {
	describe('CvNackEvent', () => {
		it('accepts CV NACK event without shortCircuit circuit', () => {
			const event: CvNackEvent = {
				event: 'programming.event.cv.nack',
				payload: {
					shortCircuit: false,
					raw: []
				}
			};
			expect(event.event).toBe('programming.event.cv.nack');
			expect(event.payload.shortCircuit).toBe(false);
		});

		it('accepts CV NACK event with shortCircuit circuit', () => {
			const event: CvNackEvent = {
				event: 'programming.event.cv.nack',
				payload: {
					shortCircuit: true,
					raw: []
				}
			};
			expect(event.payload.shortCircuit).toBe(true);
		});
	});

	describe('CvResultEvent', () => {
		it('accepts CV result event with address and value', () => {
			const event: CvResultEvent = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 29,
					value: 42,
					raw: []
				}
			};
			expect(event.event).toBe('programming.event.cv.result');
			expect(event.payload.cv).toBe(29);
			expect(event.payload.value).toBe(42);
		});

		it('accepts CV result with value 0', () => {
			const event: CvResultEvent = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 1,
					value: 0,
					raw: []
				}
			};
			expect(event.payload.value).toBe(0);
		});

		it('accepts CV result with value 255', () => {
			const event: CvResultEvent = {
				event: 'programming.event.cv.result',
				payload: {
					cv: 1,
					value: 255,
					raw: []
				}
			};
			expect(event.payload.value).toBe(255);
		});

		it('accepts different CV addresses', () => {
			const cvs = [1, 29, 1024];
			cvs.forEach((cv) => {
				const event: CvResultEvent = {
					event: 'programming.event.cv.result',
					payload: { cv, value: 100, raw: [] }
				};
				expect(event.payload.cv).toBe(cv);
			});
		});
	});
});
