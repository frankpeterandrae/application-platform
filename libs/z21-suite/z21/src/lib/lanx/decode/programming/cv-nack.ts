/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { LanXCommandKey } from '@application-platform/z21-shared';

import type { Z21Event } from '../../../event/event-types';

/**
 * Decodes a LAN_X CV NACK (negative acknowledgement) payload.
 * @param command - The LAN_X command key
 * @returns Array containing a CV NACK event, or empty array if command is not recognized
 */
export function decodeLanXCvNackPayload(command: LanXCommandKey): Extract<Z21Event, { event: 'programming.event.cv.nack' }>[] {
	if (command === 'LAN_X_CV_NACK') {
		return [
			{
				event: 'programming.event.cv.nack',
				payload: {
					shortCircuit: false,
					raw: [] // No raw data available in this case
				}
			}
		];
	} else if (command === 'LAN_X_CV_NACK_SC') {
		return [
			{
				event: 'programming.event.cv.nack',
				payload: {
					shortCircuit: true,
					raw: [] // No raw data available in this case
				}
			}
		];
	}

	return [];
}
