import type { CvNackEvent } from './cv-nack-event';
import type { CvResultEvent } from './cv-result-event';

describe('Programming Event Types', () => {
	describe('CvNackEvent', () => {
		it('accepts CV NACK event without short circuit', () => {
			const event: CvNackEvent = {
				type: 'event.cv.nack',
				payload: {
					shortCircuit: false
				}
			};
			expect(event.type).toBe('event.cv.nack');
			expect(event.payload.shortCircuit).toBe(false);
		});

		it('accepts CV NACK event with short circuit', () => {
			const event: CvNackEvent = {
				type: 'event.cv.nack',
				payload: {
					shortCircuit: true
				}
			};
			expect(event.payload.shortCircuit).toBe(true);
		});
	});

	describe('CvResultEvent', () => {
		it('accepts CV result event with address and value', () => {
			const event: CvResultEvent = {
				type: 'event.cv.result',
				cv: 29,
				value: 42,
				raw: []
			};
			expect(event.type).toBe('event.cv.result');
			expect(event.cv).toBe(29);
			expect(event.value).toBe(42);
		});

		it('accepts CV result with value 0', () => {
			const event: CvResultEvent = {
				type: 'event.cv.result',
				cv: 1,
				value: 0,
				raw: []
			};
			expect(event.value).toBe(0);
		});

		it('accepts CV result with value 255', () => {
			const event: CvResultEvent = {
				type: 'event.cv.result',
				cv: 1,
				value: 255,
				raw: []
			};
			expect(event.value).toBe(255);
		});

		it('accepts different CV addresses', () => {
			const cvs = [1, 29, 1024];
			cvs.forEach((cv) => {
				const event: CvResultEvent = {
					type: 'event.cv.result',
					cv,
					value: 100,
					raw: []
				};
				expect(event.cv).toBe(cv);
			});
		});
	});
});
