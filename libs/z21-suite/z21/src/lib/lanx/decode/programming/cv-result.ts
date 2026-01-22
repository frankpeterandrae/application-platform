/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../../event/event-types';

import { decodeCvAddress } from './../_shared';

/**
 * Decodes a LAN_X CV result payload.
 * Format: 64 14 <CV_MSB> <CV_LSB> <VALUE> <XOR>
 * Note: Z21 uses MSB-first byte order for CV addresses (verified with Z21 Maintenance Tool)
 * @param payload - The raw payload bytes (includes sub-command 0x14 at index 0)
 * @returns Array containing a CV result event with CV address and value
 */
export function decodeLanXCvResultPayload(payload: Uint8Array): Extract<Z21Event, { event: 'programming.event.cv.result' }>[] {
	// payload[0] = 0x14 (sub-command), skip it
	// payload[1] = CV_MSB, payload[2] = CV_LSB (MSB-first in Z21 protocol!)
	const cv = decodeCvAddress(payload[1], payload[2]);
	const value = payload[3];
	return [
		{
			event: 'programming.event.cv.result',
			payload: {
				cv,
				value,
				raw: Array.from(payload)
			}
		}
	];
}
