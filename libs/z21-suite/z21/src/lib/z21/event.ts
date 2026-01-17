/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Z21Dataset } from '../codec/codec-types';
import { type LanXCommandKey } from '../constants';
import { decodeLanXCommand } from '../lan-x/decode/decoder';
import { resolveLanXCommand } from '../lan-x/dispatch';
import { decodeSystemState } from '../system/decode-system-state';

import { type Z21Event } from './event-types';

/**
 * Converts a decoded Z21 dataset into one or more higher-level events.
 * - system.state datasets are decoded into Z21SystemState payloads.
 * - X-Bus datasets are inspected by xHeader to emit specific events, else event.unknown.x.bus.
 *
 * @param ds - The Z21 dataset to convert.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function dataToEvent(ds: Z21Dataset): Z21Event[] {
	if (ds.kind === 'ds.system.state') {
		return [{ type: 'event.z21.status', payload: decodeSystemState(ds.state) }];
	}

	if (ds.kind !== 'ds.x.bus') {
		return [];
	}

	const b = ds.data;
	const xHeader = b[0];

	const command: LanXCommandKey = resolveLanXCommand(b);
	const decoded = decodeLanXCommand(command, b);

	if (decoded.length > 0) {
		return decoded;
	}

	// Specific decoders for known X-Bus payloads
	return [{ type: 'event.unknown.x.bus', xHeader, bytes: Array.from(b) }];
}
