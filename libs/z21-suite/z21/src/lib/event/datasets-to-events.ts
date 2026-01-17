/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Dataset } from '../codec/codec-types';
import { decodeLanXPayload } from '../lanx/decode/decoder';
import { decodeSystemState } from '../system/decode-system-state';

import { type Z21Event } from './event-types';

/**
 * Converts a decoded Z21 dataset into one or more higher-level events.
 * - system.state datasets are decoded into Z21SystemState payloads.
 * - X-Bus datasets are inspected by xHeader to emit specific events, else unknown.lan_x.
 *
 * @param ds - The Z21 dataset to convert.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function datasetsToEvents(ds: Z21Dataset): Z21Event[] {
	// eslint-disable-next-line no-console
	console.log('Converting dataset to events:', ds);
	if (ds.kind === 'ds.system.state') {
		return [{ type: 'event.z21.status', payload: decodeSystemState(ds.state) }];
	}

	if (ds.kind === 'ds.x.bus') {
		const lanXBytes = ds.data;
		return decodeLanXPayload(ds.xHeader, lanXBytes);
	}

	// Specific decoders for known X-Bus payloads
	return [{ type: 'event.unknown.lan_x', xHeader: ds.header, bytes: Array.from(ds.payload) }];
}
