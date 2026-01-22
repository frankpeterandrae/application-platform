/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { decodeLanXCvNackPayload } from './cv-nack';
import { decodeLanXCvResultPayload } from './cv-result';

describe('CV Programming Decoders', () => {
	describe('decodeLanXCvNackPayload', () => {
		it('decodes CV NACK without shortCircuit circuit', () => {
			const events = decodeLanXCvNackPayload('LAN_X_CV_NACK');

			expect(events).toHaveLength(1);
			expect(events[0]).toEqual({
				event: 'programming.event.cv.nack',
				payload: {
					shortCircuit: false,
					raw: []
				}
			});
		});

		it('decodes CV NACK with shortCircuit circuit', () => {
			const events = decodeLanXCvNackPayload('LAN_X_CV_NACK_SC');

			expect(events).toHaveLength(1);
			expect(events[0]).toEqual({
				event: 'programming.event.cv.nack',
				payload: {
					shortCircuit: true,
					raw: []
				}
			});
		});
	});

	describe('decodeLanXCvResultPayload', () => {
		it('decodes CV result for CV1 with value 3', () => {
			// Format: [SUB_CMD=0x14, CV_MSB, CV_LSB, VALUE]
			const payload = new Uint8Array([0x14, 0x00, 0x00, 0x03]);

			const events = decodeLanXCvResultPayload(payload);

			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({
				event: 'programming.event.cv.result',
				payload: {
					cv: 1,
					value: 3
				}
			});
		});

		it('decodes CV result for CV29 with value 42', () => {
			// CV29 = 0x001C (MSB-first), value = 0x2A
			const payload = new Uint8Array([0x14, 0x00, 0x1c, 0x2a]);

			const events = decodeLanXCvResultPayload(payload);

			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({
				event: 'programming.event.cv.result',
				payload: {
					cv: 29,
					value: 42
				}
			});
		});

		it('decodes CV result with value 0', () => {
			const payload = new Uint8Array([0x14, 0x00, 0x01, 0x00]);

			const events = decodeLanXCvResultPayload(payload);

			expect(events[0]?.payload.value).toBe(0);
		});

		it('decodes CV result with value 255', () => {
			const payload = new Uint8Array([0x14, 0x00, 0x01, 0xff]);

			const events = decodeLanXCvResultPayload(payload);

			expect(events[0]?.payload.value).toBe(255);
		});

		it('decodes CV result for high address (CV1024)', () => {
			// CV1024 = 0x03FF in 0-based (becomes 1024 after +1 adjustment in decodeCvAddress)
			const payload = new Uint8Array([0x14, 0x03, 0xff, 0x64]);

			const events = decodeLanXCvResultPayload(payload);

			expect(events[0]?.payload.cv).toBe(1024);
			expect(events[0]?.payload.value).toBe(100);
		});

		it('handles insufficient data gracefully', () => {
			// Payload too shortCircuit - function still returns an event but with undefined/NaN values
			const payload = new Uint8Array([0x14]);

			const events = decodeLanXCvResultPayload(payload);

			// Function doesn't validate length, so it returns an event with undefined/NaN
			expect(events).toHaveLength(1);
			expect(events[0]?.event).toBe('programming.event.cv.result');
		});
	});
});
