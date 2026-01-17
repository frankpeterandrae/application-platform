/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Event } from '../../event/event-types';

import { decodeDccAddress, decodeFunctions, decodeSpeed } from './_shared';

/**
 * Decodes a loco info X-BUS dataset into a Z21Event array.
 *
 * @param payload - The X-BUS dataset bytes.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXLocoInfoPayload(payload: Uint8Array): Extract<Z21Event, { type: 'event.loco.info' }>[] {
	if (payload.length < 5) {
		return [];
	}
	const addr = decodeDccAddress(payload[0], payload[1]);
	const { speedSteps, speed, emergencyStop, direction, isOccupied, isMmLoco } = decodeSpeed(payload[2], payload[3]);
	const { functionMap, isDoubleTraction, isSmartsearch } = decodeFunctions(payload, 4);

	return [
		{
			type: 'event.loco.info',
			addr,
			isMmLoco,
			isOccupied,
			isDoubleTraction,
			isSmartsearch,
			speedSteps,
			speed,
			emergencyStop,
			direction,
			functionMap
		}
	];
}
