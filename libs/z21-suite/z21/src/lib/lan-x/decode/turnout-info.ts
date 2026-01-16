/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AddessByteMask } from '../../constants';
import type { Z21Event } from '../../z21/event-types';

/**
 * Decodes a turnout info X-BUS dataset into a Z21Event array.
 *
 * @param b - The X-BUS dataset bytes.
 * @returns Array of Z21Event entries produced from the dataset.
 */
export function decodeLanXTurnoutInfo(b: Uint8Array<ArrayBufferLike>): Z21Event[] {
	const addrMsb = b[1] & AddessByteMask.MSB;
	const addrLsb = b[2];
	const addr = (addrMsb << 8) + addrLsb;

	const zz = b[3] & 0x03;
	const state = zz === 1 ? 'STRAIGHT' : zz === 2 ? 'DIVERGING' : 'UNKNOWN';

	return [{ type: 'event.turnout.info', addr, state }];
}
