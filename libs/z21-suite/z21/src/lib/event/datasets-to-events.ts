/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Z21Event } from '@application-platform/z21-shared';

import type { Z21Dataset } from '../codec/codec-types';
import { decodeLanXPayload } from '../lanx/decode/decoder';
import { decodeBroadcstflags } from '../system/decode-broadcastflags';
import { decodeHwInfo } from '../system/decode-hw-info';
import { decodeSystemState } from '../system/decode-system-state';

/**
 * Converts a decoded Z21 dataset into one or more higher-level events.
 * - system.state datasets are decoded into Z21SystemState payloads.
 * - X-Bus datasets are inspected by xHeader to emit specific events, else unknown.lan_x.
 *
 * @param ds - The Z21 dataset to convert.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function datasetsToEvents(ds: Z21Dataset): Z21Event[] {
	if (ds.kind === 'ds.system.state') {
		return [{ event: 'system.event.state', payload: { ...decodeSystemState(ds.state), raw: Array.from(ds.state) } }];
	}

	if (ds.kind === 'ds.x.bus') {
		const lanXBytes = ds.data;
		return decodeLanXPayload(ds.xHeader, lanXBytes);
	}

	if (ds.kind === 'ds.hwinfo') {
		return [decodeHwInfo(ds.hwtype, ds.fwVersionBcd)];
	}

	if (ds.kind === 'ds.code') {
		return [{ event: 'system.event.z21.code', payload: { code: ds.code, raw: [ds.code] } }];
	}
	if (ds.kind === 'ds.broadcast.flags') {
		return [decodeBroadcstflags(ds.flags)];
	}

	// bad_xor / unknown -> keine Events, Observability läuft im Handler über Logging
	return [];
}
