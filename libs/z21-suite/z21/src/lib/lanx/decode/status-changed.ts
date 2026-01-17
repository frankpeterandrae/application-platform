/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type Z21Event } from '../../event/event-types';

/**
 * Decodes LAN X system commands into Z21Event arrays.
 *
 * @param payload - The X-BUS dataset bytes.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXStatusChangedPayload(payload: Uint8Array): Extract<Z21Event, { type: 'event.system.state' }>[] {
	if (payload.length < 2) {
		return [];
	}
	return [{ type: 'event.system.state', statusMask: payload[1] }];
}
