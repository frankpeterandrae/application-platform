/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { TurnoutState } from '@application-platform/z21-shared';

import type { Z21Event } from '../../event/event-types';

import { decodeDccAddress } from './_shared';

/**
 * Decodes a turnout info X-BUS dataset into a Z21Event array.
 *
 * @param payload - The X-BUS dataset bytes.
 *
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXTurnoutInfoPayload(payload: Uint8Array): Extract<Z21Event, { event: 'switching.event.turnout.info' }>[] {
	const raw = Array.from(payload);
	const addr = decodeDccAddress(payload[0], payload[1]);

	const zz = payload[2] & 0x03;
	let state: TurnoutState;
	if (zz === 1) {
		state = TurnoutState.STRAIGHT;
	} else if (zz === 2) {
		state = TurnoutState.DIVERGING;
	} else {
		state = TurnoutState.UNKNOWN;
	}

	return [{ event: 'switching.event.turnout.info', payload: { addr, state, raw } }];
}
