/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Z21LanHeader, type LanXCommandKey } from '@application-platform/z21-shared';

import type { Z21Dataset } from '../codec/codec-types';
import { decodeLanXPayload } from '../lanx/decode/decoder';
import { resolveLanXCommand } from '../lanx/dispatch';
import { decodeSystemState } from '../system/decode-system-state';

import { type Z21Event } from './event-types';

/**
 * Converts a decoded Z21 dataset into one or more higher-level events.
 * - system.state datasets are decoded into Z21SystemState payloads.
 * - X-Bus datasets are inspected by xHeader to emit specific events, else unknown.x.bus.
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

	if (ds.kind !== 'ds.x.bus') {
		return [];
	}

	const b = ds.data;
	const lanXBytes = ds.xHeader === Z21LanHeader.LAN_X ? b : Uint8Array.from([Z21LanHeader.LAN_X, ...b]);

	const command: LanXCommandKey = resolveLanXCommand(lanXBytes);
	const byPayload = decodeLanXPayload(command, lanXBytes);
	if (byPayload.length > 0) {
		return byPayload;
	}

	// Specific decoders for known X-Bus payloads
	return ds.xHeader === Z21LanHeader.LAN_X
		? [{ type: 'event.unknown.lan_x', command, bytes: Array.from(lanXBytes) }]
		: [{ type: 'event.unknown.x.bus', xHeader: ds.xHeader, bytes: Array.from(b) }];
}
