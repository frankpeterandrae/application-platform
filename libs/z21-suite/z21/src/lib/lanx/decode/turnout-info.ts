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
export function decodeLanXTurnoutInfoPayload(payload: Uint8Array): Extract<Z21Event, { type: 'event.turnout.info' }>[] {
	const addr = decodeDccAddress(payload[0], payload[1]);

	const zz = payload[2] & 0x03;
	const state: TurnoutState = zz === 1 ? TurnoutState.STRAIGHT : zz === 2 ? TurnoutState.DIVERGING : TurnoutState.UNKNOWN;

	return [{ type: 'event.turnout.info', addr, state }];
}
